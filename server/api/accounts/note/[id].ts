import { z } from 'zod'
import { ACCOUNT_NOTE_COLORS } from '~/shared/types'
import { appError, defineApiHandler } from '~/server/utils/api'
import { updateAccountNoteById } from '~/server/utils/account-service'

const bodySchema = z.object({
  note: z.string().trim().max(500, '备注最多 500 个字符').nullable(),
  noteColor: z.enum(ACCOUNT_NOTE_COLORS).default('gray'),
})

export default defineApiHandler(async (event) => {
  if (event.method !== 'PATCH') {
    throw appError(405, 'METHOD_NOT_ALLOWED', '请求方法不支持')
  }

  const rawId = getRouterParam(event, 'id')
  const id = Number(rawId)
  const body = await readBody(event)
  const result = bodySchema.safeParse(body)

  if (!rawId || Number.isNaN(id) || id <= 0) {
    throw appError(400, 'INVALID_ACCOUNT_ID', '账号 ID 不合法')
  }

  if (!result.success) {
    throw appError(400, 'INVALID_BODY', result.error.issues[0]?.message || '请求参数不合法')
  }

  return updateAccountNoteById(id, result.data.note || null, result.data.noteColor)
})
