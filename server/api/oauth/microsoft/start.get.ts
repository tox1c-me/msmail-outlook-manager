import { z } from 'zod'
import { MAIL_PROTOCOLS } from '~/shared/types'
import { appError } from '~/server/utils/api'
import { createMicrosoftOAuthLogin } from '~/server/utils/microsoft-oauth-login'

const querySchema = z.object({
  protocol: z.enum(MAIL_PROTOCOLS).default('graph'),
  clientId: z.string().trim().min(1),
})

export default defineEventHandler((event) => {
  const result = querySchema.safeParse(getQuery(event))

  if (!result.success) {
    throw appError(400, 'INVALID_PROTOCOL', '请选择 Graph 或 IMAP 登录方式')
  }

  return sendRedirect(event, createMicrosoftOAuthLogin(result.data.protocol, result.data.clientId))
})
