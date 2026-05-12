import { t } from 'elysia'

export const User = t.Object({
  id: t.String({ description: '用户 ID' }),
  username: t.Union([t.String(), t.Null()], { description: '用户名' }),
  phone: t.Union([t.String(), t.Null()], { description: '手机号' }),
  email: t.Union([t.String(), t.Null()], { description: '邮箱' }),
  password: t.Union([t.String(), t.Null()], { description: '密码（哈希值）' }),
  nickname: t.Union([t.String(), t.Null()], { description: '昵称' }),
  avatar: t.Union([t.String(), t.Null()], { description: '头像 URL' }),
  gender: t.Integer({ description: '性别：0-未知，1-男，2-女' }),
  birthday: t.Union([t.String(), t.Null()], { description: '出生日期' }),
  deviceType: t.String({ description: '最后登录设备类型' }),
  deviceModel: t.Union([t.String(), t.Null()], { description: '设备型号' }),
  appVersion: t.Union([t.String(), t.Null()], { description: 'App 版本' }),
  osVersion: t.Union([t.String(), t.Null()], { description: '操作系统版本' }),
  lastLoginAt: t.Union([t.Date(), t.Null()], { description: '最后登录时间' }),
  lastLoginIp: t.Union([t.String(), t.Null()], { description: '最后登录 IP' }),
  status: t.Boolean({ description: '账号状态' }),
  createdAt: t.Date({ description: '创建时间' }),
  updatedAt: t.Date({ description: '更新时间' }),
  deletedAt: t.Union([t.Date(), t.Null()], { description: '删除时间' }),
})

export const UserResponse = t.Object({
  id: t.String({ description: '用户 ID' }),
  username: t.Union([t.String(), t.Null()], { description: '用户名' }),
  phone: t.Union([t.String(), t.Null()], { description: '手机号' }),
  email: t.Union([t.String(), t.Null()], { description: '邮箱' }),
  nickname: t.Union([t.String(), t.Null()], { description: '昵称' }),
  avatar: t.Union([t.String(), t.Null()], { description: '头像 URL' }),
  gender: t.Integer({ description: '性别：0-未知，1-男，2-女' }),
  birthday: t.Union([t.String(), t.Null()], { description: '出生日期' }),
  deviceType: t.String({ description: '最后登录设备类型' }),
  deviceModel: t.Union([t.String(), t.Null()], { description: '设备型号' }),
  appVersion: t.Union([t.String(), t.Null()], { description: 'App 版本' }),
  osVersion: t.Union([t.String(), t.Null()], { description: '操作系统版本' }),
  lastLoginAt: t.Union([t.Date(), t.Null()], { description: '最后登录时间' }),
  lastLoginIp: t.Union([t.String(), t.Null()], { description: '最后登录 IP' }),
  status: t.Boolean({ description: '账号状态' }),
  createdAt: t.Date({ description: '创建时间' }),
  updatedAt: t.Date({ description: '更新时间' }),
  deletedAt: t.Union([t.Date(), t.Null()], { description: '删除时间' }),
})

export const CreateUser = t.Object({
  username: t.Optional(t.String({ minLength: 1, maxLength: 50, description: '用户名' })),
  phone: t.Optional(t.String({ minLength: 11, maxLength: 11, description: '手机号（11 位）' })),
  email: t.Optional(t.String({ format: 'email', description: '邮箱' })),
  password: t.String({ minLength: 6, maxLength: 100, description: '密码（最少 6 位）' }),
  nickname: t.Optional(t.String({ maxLength: 50, description: '昵称' })),
  avatar: t.Optional(t.String({ description: '头像 URL' })),
  gender: t.Optional(t.Integer({ minimum: 0, maximum: 2, description: '性别：0-未知，1-男，2-女' })),
  birthday: t.Optional(t.String({ description: '出生日期' })),
  status: t.Optional(t.Boolean({ description: '账号状态，默认启用' })),
})

export const UpdateUser = t.Object({
  username: t.Optional(t.String({ minLength: 1, maxLength: 50, description: '用户名' })),
  phone: t.Optional(t.String({ minLength: 11, maxLength: 11, description: '手机号' })),
  email: t.Optional(t.String({ format: 'email', description: '邮箱' })),
  password: t.Optional(t.String({ minLength: 6, maxLength: 100, description: '密码' })),
  nickname: t.Optional(t.String({ maxLength: 50, description: '昵称' })),
  avatar: t.Optional(t.String({ description: '头像 URL' })),
  gender: t.Optional(t.Integer({ minimum: 0, maximum: 2, description: '性别' })),
  birthday: t.Optional(t.String({ description: '出生日期' })),
  status: t.Optional(t.Boolean({ description: '账号状态' })),
})

export const LoginRequest = t.Object({
  account: t.String({ minLength: 1, maxLength: 50, description: '账号（用户名/手机号/邮箱）' }),
  password: t.String({ minLength: 1, maxLength: 100, description: '密码' }),
})

export const LoginResponse = t.Object({
  token: t.String({ description: 'JWT token' }),
  user: UserResponse,
})

export const UserError = t.Object({
  message: t.String({ description: '错误信息' }),
})

/** 头像上传响应 */
export const AvatarUploadResponse = t.Object({
  message: t.String({ description: '提示信息' }),
  avatar: t.String({ description: '头像 URL' }),
})

export type UserType = typeof User.static
export type UserResponseType = typeof UserResponse.static
export type CreateUserType = typeof CreateUser.static
export type UpdateUserType = typeof UpdateUser.static
export type LoginRequestType = typeof LoginRequest.static
export type LoginResponseType = typeof LoginResponse.static
export type AvatarUploadResponseType = typeof AvatarUploadResponse.static
