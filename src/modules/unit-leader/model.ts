import { t } from 'elysia'

/** 负责人完整信息 */
export const UnitLeader = t.Object({
  id: t.String({ description: '记录 ID' }),
  unitId: t.String({ description: '所属单位 ID' }),
  userId: t.String({ description: '负责人用户 ID' }),
  sort: t.Number({ description: '排序，数值越小地位越高' }),
  createdAt: t.Date({ description: '创建时间' }),
  updatedAt: t.Date({ description: '更新时间' }),
  deletedAt: t.Union([t.Date(), t.Null()], { description: '删除时间，null 表示未删除' }),
})

/** 创建负责人请求体 */
export const CreateUnitLeader = t.Object({
  unitId: t.String({ description: '所属单位 ID' }),
  userId: t.String({ description: '负责人用户 ID' }),
  sort: t.Optional(t.Number({ minimum: 0, description: '排序，默认 0（第一负责人）' })),
})

/** 更新负责人请求体 */
export const UpdateUnitLeader = t.Object({
  sort: t.Optional(t.Number({ minimum: 0, description: '排序' })),
})

/** 错误响应 */
export const UnitLeaderError = t.Object({
  message: t.String({ description: '错误信息' }),
})

export type UnitLeaderType = typeof UnitLeader.static
export type CreateUnitLeaderType = typeof CreateUnitLeader.static
export type UpdateUnitLeaderType = typeof UpdateUnitLeader.static
