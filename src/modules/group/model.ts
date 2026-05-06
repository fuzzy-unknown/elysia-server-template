import { t } from 'elysia'

/** 组完整信息 */
export const Group = t.Object({
  id: t.String({ description: '组 ID' }),
  name: t.String({ description: '组名称' }),
  description: t.Union([t.String(), t.Null()], { description: '组描述' }),
  createdBy: t.String({ description: '创建者 ID' }),
  status: t.Boolean({ description: '状态：true-启用，false-停用' }),
  createdAt: t.Date({ description: '创建时间' }),
  updatedAt: t.Date({ description: '更新时间' }),
  deletedAt: t.Union([t.Date(), t.Null()], { description: '删除时间' }),
})

/** 创建组请求体 */
export const CreateGroup = t.Object({
  name: t.String({ minLength: 1, maxLength: 100, description: '组名称' }),
  description: t.Optional(t.String({ maxLength: 500, description: '组描述' })),
})

/** 更新组请求体 */
export const UpdateGroup = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 100, description: '组名称' })),
  description: t.Optional(t.String({ maxLength: 500, description: '组描述' })),
  status: t.Optional(t.Boolean({ description: '状态' })),
})

/** 添加成员请求体 */
export const AddMemberRequest = t.Object({
  userId: t.String({ description: '用户 ID' }),
  role: t.Optional(t.String({ maxLength: 50, description: '角色/头衔' })),
})

/** 更新成员角色请求体 */
export const UpdateMemberRequest = t.Object({
  role: t.String({ maxLength: 50, description: '角色/头衔' }),
})

/** 错误响应 */
export const GroupError = t.Object({
  message: t.String({ description: '错误信息' }),
})

export type GroupType = typeof Group.static
export type CreateGroupType = typeof CreateGroup.static
export type UpdateGroupType = typeof UpdateGroup.static
export type AddMemberRequestType = typeof AddMemberRequest.static
export type UpdateMemberRequestType = typeof UpdateMemberRequest.static
