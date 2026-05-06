import { t } from 'elysia'

/** 用户完整信息（含密码，仅内部使用） */
export const User = t.Object({
  id: t.String({ description: '用户 ID' }),
  username: t.String({ description: '用户名' }),
  password: t.String({ description: '密码（哈希值）' }),
  idCard: t.Union([t.String(), t.Null()], { description: '身份证号码' }),
  unitId: t.Union([t.String(), t.Null()], { description: '所属单位 ID' }),
  level: t.Union([t.String(), t.Null()], { description: '评定等级' }),
  status: t.Boolean({ description: '账号状态：true-启用，false-停用' }),
  remark: t.Union([t.String(), t.Null()], { description: '备注' }),
  createdAt: t.Date({ description: '创建时间' }),
  updatedAt: t.Date({ description: '更新时间' }),
  deletedAt: t.Union([t.Date(), t.Null()], { description: '删除时间，null 表示未删除' }),
})

/** 用户响应（排除密码字段） */
export const UserResponse = t.Object({
  id: t.String({ description: '用户 ID' }),
  username: t.String({ description: '用户名' }),
  idCard: t.Union([t.String(), t.Null()], { description: '身份证号码' }),
  unitId: t.Union([t.String(), t.Null()], { description: '所属单位 ID' }),
  level: t.Union([t.String(), t.Null()], { description: '评定等级' }),
  status: t.Boolean({ description: '账号状态' }),
  remark: t.Union([t.String(), t.Null()], { description: '备注' }),
  createdAt: t.Date({ description: '创建时间' }),
  updatedAt: t.Date({ description: '更新时间' }),
  deletedAt: t.Union([t.Date(), t.Null()], { description: '删除时间' }),
})

/** 创建用户请求体 */
export const CreateUser = t.Object({
  username: t.String({ minLength: 1, maxLength: 50, description: '用户名' }),
  password: t.String({ minLength: 6, maxLength: 100, description: '密码（最少6位）' }),
  idCard: t.Optional(t.String({ minLength: 18, maxLength: 18, description: '身份证号码（18位）' })),
  unitId: t.Optional(t.String({ description: '所属单位 ID' })),
  level: t.Optional(t.String({ description: '评定等级' })),
  status: t.Optional(t.Boolean({ description: '账号状态，默认启用' })),
  remark: t.Optional(t.String({ description: '备注' })),
})

/** 更新用户请求体 */
export const UpdateUser = t.Object({
  username: t.Optional(t.String({ minLength: 1, maxLength: 50, description: '用户名' })),
  password: t.Optional(t.String({ minLength: 6, maxLength: 100, description: '密码' })),
  idCard: t.Optional(t.String({ minLength: 18, maxLength: 18, description: '身份证号码（18位）' })),
  unitId: t.Optional(t.String({ description: '所属单位 ID' })),
  level: t.Optional(t.String({ description: '评定等级' })),
  status: t.Optional(t.Boolean({ description: '账号状态' })),
  remark: t.Optional(t.String({ description: '备注' })),
})

/** 登录请求体 */
export const LoginRequest = t.Object({
  username: t.String({ minLength: 1, maxLength: 50, description: '用户名' }),
  password: t.String({ minLength: 1, maxLength: 100, description: '密码' }),
})

/** 登录响应 */
export const LoginResponse = t.Object({
  token: t.String({ description: 'JWT token' }),
  user: UserResponse,
})

/** 错误响应 */
export const UserError = t.Object({
  message: t.String({ description: '错误信息' }),
})

export type UserType = typeof User.static
export type UserResponseType = typeof UserResponse.static
export type CreateUserType = typeof CreateUser.static
export type UpdateUserType = typeof UpdateUser.static
export type LoginRequestType = typeof LoginRequest.static
export type LoginResponseType = typeof LoginResponse.static
