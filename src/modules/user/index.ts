import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import type { UserType } from './model'
import { Elysia, t } from 'elysia'
import { CreateUser, LoginRequest, LoginResponse, UpdateUser, UserError, UserResponse } from './model'
import { UserService } from './service'

function omitPassword(user: UserType) {
  const { password: _, ...rest } = user
  return rest
}

export function createUserRouter(database: BunSQLiteDatabase) {
  const userService = new UserService(database)

  return new Elysia({ prefix: '/users' })
    .decorate({ userService })
    .model({
      'user.response': UserResponse,
      'user.create': CreateUser,
      'user.update': UpdateUser,
      'user.error': UserError,
      'user.login': LoginRequest,
      'user.login.response': LoginResponse,
    })
    // ==================== 登录 ====================
    .post('/login', async ({ jwt, body, status }) => {
      const user = userService.getByUsername(body.username)
      if (!user)
        return status(401, { message: '用户名或密码错误' })

      const valid = await Bun.password.verify(body.password, user.password)
      if (!valid)
        return status(401, { message: '用户名或密码错误' })

      const token = await jwt.sign({ userId: user.id })
      return { token, user: omitPassword(user) }
    }, {
      detail: {
        summary: '用户登录',
        description: '通过用户名和密码登录，返回 JWT token 和用户信息',
        tags: ['用户管理'],
      },
      body: LoginRequest,
      response: { 200: LoginResponse, 401: UserError },
    })
    // ==================== 查询 ====================
    .get('/', ({ userService }) => userService.getAll().map(omitPassword), {
      detail: {
        summary: '获取所有用户列表',
        description: '返回所有未删除的用户列表，响应中不包含密码字段',
        tags: ['用户管理'],
      },
      response: { 200: t.Array(UserResponse) },
    })
    .get('/:id', ({ userService, params: { id }, status }) => {
      const user = userService.getById(id)
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
    // ==================== 写操作（需认证） ====================
    .post('/', async ({ userService, body, status }) => {
      const user = await userService.create(body)
      return status(201, omitPassword(user))
    }, {
      isSignIn: true,
      detail: {
        summary: '创建用户',
        description: '创建新用户账号。用户名唯一，密码最少6位。可指定所属单位 ID 和评定等级。',
        tags: ['用户管理'],
      },
      body: CreateUser,
      response: { 201: UserResponse },
    })
    .put('/:id', async ({ userService, params: { id }, body, status }) => {
      const user = await userService.update(id, body)
      if (!user)
        return status(404, { message: '用户不存在' })
      return omitPassword(user)
    }, {
      isSignIn: true,
      detail: {
        summary: '更新用户信息',
        description: '更新指定用户的信息。支持修改用户名、密码、身份证、所属单位、评定等级、状态和备注。所有字段均为可选。',
        tags: ['用户管理'],
      },
      params: t.Object({ id: t.String({ description: '用户 ID' }) }),
      body: UpdateUser,
      response: { 200: UserResponse, 404: UserError },
    })
    .delete('/:id', ({ userService, params: { id }, status }) => {
      const user = userService.remove(id)
      if (!user)
        return status(404, { message: '用户不存在' })
      return omitPassword(user)
    }, {
      isSignIn: true,
      detail: {
        summary: '删除用户（软删除）',
        description: '软删除指定用户，设置 deletedAt 时间戳。删除后该用户不会出现在列表中，且无法登录。',
        tags: ['用户管理'],
      },
      params: t.Object({ id: t.String({ description: '用户 ID' }) }),
      response: { 200: UserResponse, 404: UserError },
    })
}
