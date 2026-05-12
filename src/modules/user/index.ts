/** 用户管理路由层 */
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import type { UserType } from './model'
import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth'
import { CreateUser, LoginRequest, LoginResponse, UpdateUser, UserError, UserResponse } from './model'
import { userService } from './service'

function omitPassword(user: UserType) {
  const { password: _, ...rest } = user
  return rest
}

/** 从请求头提取设备信息 */
function getDeviceInfo(request: Request) {
  const userAgent = request.headers.get('user-agent') || ''
  const deviceType = userAgent.includes('iPhone')
    ? 'ios'
    : userAgent.includes('Android')
      ? 'android'
      : 'web'
  return {
    deviceType,
    deviceModel: request.headers.get('x-device-model') ?? undefined,
    appVersion: request.headers.get('x-app-version') ?? undefined,
    osVersion: request.headers.get('x-os-version') ?? undefined,
  }
}

export function createUserRouter(database: BunSQLiteDatabase) {
  return new Elysia({ prefix: '/users' })
    .use(authPlugin)
    .model({
      'user.response': UserResponse,
      'user.create': CreateUser,
      'user.update': UpdateUser,
      'user.error': UserError,
      'user.login': LoginRequest,
      'user.login.response': LoginResponse,
    })
    .post('/login', async ({ jwt, body, status, request, server }) => {
      // 1. 根据账号（用户名/手机号/邮箱）查找用户
      const user = userService.getByAccount(database, body.account)
      if (!user)
        return status(401, { message: '账号或密码错误' })

      // 2. 验证密码（密码为 null 时直接返回失败）
      if (!user.password)
        return status(401, { message: '账号或密码错误' })
      const valid = await Bun.password.verify(body.password, user.password)
      if (!valid)
        return status(401, { message: '账号或密码错误' })

      // 3. 签发 JWT token
      const token = await jwt.sign({ userId: user.id })

      // 4. 更新登录信息（设备、IP、时间）
      const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
        || request.headers.get('x-real-ip')
        || server?.requestIP?.(request)?.address
        || '127.0.0.1'
      const deviceInfo = getDeviceInfo(request)
      userService.updateLoginInfo(database, user.id, deviceInfo, clientIP || '127.0.0.1')

      return { token, user: omitPassword(user) }
    }, {
      detail: {
        summary: '用户登录',
        description: '通过账号（用户名/手机号/邮箱）和密码登录，返回 JWT token 和用户信息，并记录登录设备信息',
        tags: ['用户管理'],
      },
      body: LoginRequest,
      response: { 200: LoginResponse, 401: UserError },
    })
    .get('/', () => userService.getAll(database).map(omitPassword), {
      detail: {
        summary: '获取所有用户列表',
        description: '返回所有未删除的用户列表，响应中不包含密码字段',
        tags: ['用户管理'],
      },
      response: { 200: t.Array(UserResponse) },
    })
    .get('/:id', ({ params: { id }, status }) => {
      const user = userService.getById(database, id)
      if (!user)
        return status(404, { message: '用户不存在' })
      return omitPassword(user)
    }, {
      detail: {
        summary: '根据 ID 获取用户详情',
        description: '通过用户 ID 查询用户的详细信息，响应中不包含密码字段',
        tags: ['用户管理'],
      },
      params: t.Object({ id: t.String({ description: '用户 ID' }) }),
      response: { 200: UserResponse, 404: UserError },
    })
    .post('/', async ({ body, status }) => {
      const user = await userService.create(database, body)
      return status(201, omitPassword(user))
    }, {
      isSignIn: true,
      detail: {
        summary: '创建用户',
        description: '创建新用户账号。用户名、手机号、邮箱至少填写一项，密码最少 6 位。',
        tags: ['用户管理'],
      },
      body: CreateUser,
      response: { 201: UserResponse },
    })
    .put('/:id', async ({ params: { id }, body, status }) => {
      const user = await userService.update(database, id, body)
      if (!user)
        return status(404, { message: '用户不存在' })
      return omitPassword(user)
    }, {
      isSignIn: true,
      detail: {
        summary: '更新用户信息',
        description: '更新指定用户的信息。所有字段均为可选。',
        tags: ['用户管理'],
      },
      params: t.Object({ id: t.String({ description: '用户 ID' }) }),
      body: UpdateUser,
      response: { 200: UserResponse, 404: UserError },
    })
    .delete('/:id', ({ params: { id }, status }) => {
      const user = userService.remove(database, id)
      if (!user)
        return status(404, { message: '用户不存在' })
      return omitPassword(user)
    }, {
      isSignIn: true,
      detail: {
        summary: '删除用户（软删除）',
        description: '软删除指定用户，设置 deletedAt 时间戳。',
        tags: ['用户管理'],
      },
      params: t.Object({ id: t.String({ description: '用户 ID' }) }),
      response: { 200: UserResponse, 404: UserError },
    })
}
