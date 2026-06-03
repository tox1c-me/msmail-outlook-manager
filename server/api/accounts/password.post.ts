import { z } from 'zod'
import { appError, defineApiHandler } from '~/server/utils/api'
import { updateAccountPasswordByEmail } from '~/server/utils/account-service'

const bodySchema = z.object({
  email: z.string().trim().email('邮箱格式不合法'),
  password: z.string().trim().min(1, '密码不能为空').max(500, '密码最多 500 个字符'),
})

export default defineApiHandler(async (event) => {
  if (event.method !== 'POST') {
    throw appError(405, 'METHOD_NOT_ALLOWED', '请求方法不支持')
  }

  const result = bodySchema.safeParse(await readBody(event))
  if (!result.success) {
    throw appError(400, 'INVALID_BODY', result.error.issues[0]?.message || '请求参数不合法')
  }

  return updateAccountPasswordByEmail(result.data.email, result.data.password)
})
