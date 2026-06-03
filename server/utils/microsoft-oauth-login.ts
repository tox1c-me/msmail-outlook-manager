import { createHash, randomBytes } from 'node:crypto'
import { useRuntimeConfig } from '#imports'
import type { MailProtocol } from '~/shared/types'
import { appError } from '~/server/utils/api'
import { upsertOAuthAccount } from '~/server/utils/account-service'

interface OAuthSession {
  codeVerifier: string
  clientId: string
  mailProtocol: MailProtocol
  createdAt: number
}

interface TokenResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  id_token?: string
  error?: string
  error_description?: string
}

interface IdTokenPayload {
  email?: string
  preferred_username?: string
  upn?: string
}

const SESSION_TTL_MS = 10 * 60 * 1000
const TOKEN_REQUEST_TIMEOUT_MS = 15000
const TOKEN_REQUEST_MAX_ATTEMPTS = 2
const oauthSessions = new Map<string, OAuthSession>()

export function createMicrosoftOAuthLogin(
  mailProtocol: MailProtocol,
  requestedClientId?: string,
  loginHint?: string,
) {
  const config = useRuntimeConfig()
  const clientId = requireConfig(requestedClientId || config.msClientId, 'client_id')
  const redirectUri = requireConfig(config.msRedirectUri, 'MS_REDIRECT_URI')
  const state = randomUrlSafeValue()
  const codeVerifier = randomUrlSafeValue()
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')

  cleanupExpiredSessions()
  oauthSessions.set(state, {
    codeVerifier,
    clientId,
    mailProtocol,
    createdAt: Date.now(),
  })

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: getLoginScope(mailProtocol),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  })

  if (loginHint?.trim()) {
    params.set('login_hint', loginHint.trim().toLowerCase())
  }

  return `${config.msAuthorizeEndpoint}?${params.toString()}`
}

export async function completeMicrosoftOAuthLogin(state: string, code: string) {
  cleanupExpiredSessions()

  const session = oauthSessions.get(state)
  oauthSessions.delete(state)

  if (!session) {
    throw appError(400, 'OAUTH_STATE_INVALID', '登录状态已失效，请重新发起 Outlook 登录')
  }

  const config = useRuntimeConfig()
  const redirectUri = requireConfig(config.msRedirectUri, 'MS_REDIRECT_URI')
  const tokenBody = new URLSearchParams({
      client_id: session.clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: session.codeVerifier,
      scope: getLoginScope(session.mailProtocol),
    })
  const { response, payload } = await requestMicrosoftToken(config.msTokenEndpoint, tokenBody)

  if (!response.ok || !payload.refresh_token || !payload.access_token || !payload.expires_in) {
    throw appError(
      502,
      'OAUTH_TOKEN_EXCHANGE_FAILED',
      payload.error_description || payload.error || '微软登录完成，但未返回可用的授权信息',
    )
  }

  const email = readEmailFromIdToken(payload.id_token)
  if (!email) {
    throw appError(502, 'OAUTH_EMAIL_MISSING', '微软登录完成，但未返回邮箱地址')
  }

  await upsertOAuthAccount({
    email,
    clientId: session.clientId,
    refreshToken: payload.refresh_token,
    accessToken: payload.access_token,
    tokenExpires: new Date(Date.now() + payload.expires_in * 1000),
    mailProtocol: session.mailProtocol,
  })

  return {
    email,
    mailProtocol: session.mailProtocol,
  }
}

function getLoginScope(mailProtocol: MailProtocol) {
  const config = useRuntimeConfig()
  const providerScope = mailProtocol === 'imap' ? config.msImapScope : config.msGraphScope
  return `openid profile email ${providerScope}`
}

function readEmailFromIdToken(idToken: string | undefined) {
  if (!idToken) {
    return ''
  }

  try {
    const [, encodedPayload] = idToken.split('.')
    if (!encodedPayload) {
      return ''
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as IdTokenPayload
    return (payload.preferred_username || payload.email || payload.upn || '').trim().toLowerCase()
  }
  catch {
    return ''
  }
}

async function requestMicrosoftToken(url: string, body: URLSearchParams) {
  let lastError: unknown = null

  for (let attempt = 1; attempt <= TOKEN_REQUEST_MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TOKEN_REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
        signal: controller.signal,
      })
      const payload = await readTokenPayload(response)

      if (shouldRetryTokenResponse(response) && attempt < TOKEN_REQUEST_MAX_ATTEMPTS) {
        await wait(750)
        continue
      }

      return {
        response,
        payload,
      }
    }
    catch (error) {
      lastError = error

      if (attempt < TOKEN_REQUEST_MAX_ATTEMPTS) {
        await wait(750)
        continue
      }
    }
    finally {
      clearTimeout(timeout)
    }
  }

  throw appError(
    502,
    'OAUTH_TOKEN_REQUEST_FAILED',
    lastError instanceof Error
      ? `请求微软授权服务失败：${lastError.message}`
      : '请求微软授权服务失败，请稍后重试',
  )
}

async function readTokenPayload(response: Response): Promise<TokenResponse> {
  try {
    return await response.json() as TokenResponse
  }
  catch {
    return {}
  }
}

function shouldRetryTokenResponse(response: Response) {
  return response.status === 429 || response.status >= 500
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomUrlSafeValue() {
  return randomBytes(32).toString('base64url')
}

function cleanupExpiredSessions() {
  const expiresBefore = Date.now() - SESSION_TTL_MS
  for (const [state, session] of oauthSessions) {
    if (session.createdAt < expiresBefore) {
      oauthSessions.delete(state)
    }
  }
}

function requireConfig(value: string | undefined, name: string) {
  if (!value?.trim()) {
    throw appError(500, 'OAUTH_CONFIG_MISSING', `请先在 .env 中配置 ${name}`)
  }

  return value.trim()
}
