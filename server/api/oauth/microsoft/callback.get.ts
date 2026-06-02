import { z } from 'zod'
import { completeMicrosoftOAuthLogin } from '~/server/utils/microsoft-oauth-login'

const querySchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  if (typeof query.error === 'string') {
    return sendPopupResult(event, {
      success: false,
      message: typeof query.error_description === 'string'
        ? query.error_description
        : query.error,
    })
  }

  const result = querySchema.safeParse(query)
  if (!result.success) {
    return sendPopupResult(event, {
      success: false,
      message: '微软登录回调缺少必要参数，请重新登录',
    })
  }

  try {
    const account = await completeMicrosoftOAuthLogin(result.data.state, result.data.code)
    return sendPopupResult(event, {
      success: true,
      message: `${account.email} 已授权并导入`,
      email: account.email,
    })
  }
  catch (error) {
    console.error('[microsoft-oauth-callback]', error)
    return sendPopupResult(event, {
      success: false,
      message: readErrorMessage(error),
    })
  }
})

function readErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'statusMessage' in error) {
    const statusMessage = (error as { statusMessage?: unknown }).statusMessage
    if (typeof statusMessage === 'string' && statusMessage.trim()) {
      return statusMessage
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return '微软登录失败，请重试'
}

function sendPopupResult(
  event: Parameters<typeof setResponseHeader>[0],
  payload: { success: boolean, message: string, email?: string },
) {
  setResponseHeader(event, 'Content-Type', 'text/html; charset=utf-8')
  const serializedPayload = JSON.stringify(payload).replace(/</g, '\\u003c')
  const title = payload.success ? '登录成功' : '登录失败'

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <title>${title}</title>
  </head>
  <body>
    <p>${title}，窗口即将关闭。</p>
    <script>
      const payload = ${serializedPayload};
      window.localStorage.setItem('msmail-oauth-result', JSON.stringify({ ...payload, createdAt: Date.now() }));
      if (window.opener) {
        window.opener.postMessage({ type: 'msmail-oauth-result', ...payload }, window.location.origin);
      }
      window.close();
    </script>
  </body>
</html>`
}
