/**
 * 用户管理路由层
 *
 * 路由设计：
 * - POST   /users/login   用户登录（公开，不需要认证）
 * - GET    /users          获取所有用户列表
 * - GET    /users/:id      获取单个用户详情
 * - POST   /users          创建用户（需认证 isSignIn）
 * - PUT    /users/:id      更新用户（需认证 isSignIn）
 * - DELETE /users/:id      软删除用户（需认证 isSignIn）
 *
 * 安全策略：
 * - 所有返回给前端的响应都通过 omitPassword() 剥离密码字段
 * - 登录失败统一返回"用户名或密码错误"，不透露具体是用户名不存在还是密码错误
 */
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import type { UserType } from './model'
import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth'
import { CreateUser, LoginRequest, LoginResponse, UpdateUser, UserError, UserResponse } from './model'
import { UserService } from './service'

/** 从用户对象中移除密码字段，防止密码泄露到 API 响应中 */
function omitPassword(user: UserType) {
  const { password: _, ...rest } = user
  return rest
}

export function createUserRouter(database: BunSQLiteDatabase) {
  const userService = new UserService(database)

  return new Elysia({ prefix: '/users' })
    .use(authPlugin)
    .decorate({ userService })
    .model({
      'user.response': UserResponse,
      'user.create': CreateUser,
      'user.update': UpdateUser,
      'user.error': UserError,
      'user.login': LoginRequest,
      'user.login.response': LoginResponse,
    })
    // ==================== 登录（公开接口，无需认证） ====================
    .post('/login', async ({ jwt, body, status }) => {
      // 1. 根据用户名查找用户（含密码哈希，用于后续验证）
      const user = userService.getByUsername(body.username)
      if (!user)
        return status(401, { message: '用户名或密码错误' })

      // 2. 使用 Bun.password.verify 比对密码（bcrypt 哈希比较，恒定时间）
      const valid = await Bun.password.verify(body.password, user.password)
      if (!valid)
        return status(401, { message: '用户名或密码错误' })

      // 3. 验证通过，签发 JWT token（有效期 7 天，在 authPlugin 中配置）
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
    // ==================== 写操作（需认证 isSignIn: true） ====================
    .post('/', async ({ userService, body, status }) => {
      // 创建用户时 service 层会自动对密码进行哈希处理
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
      // 更新时如果包含 password 字段，service 层会自动重新哈希
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
