import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import type { UserType } from './model'
/** 用户管理路由层 */
import { Elysia, t } from 'elysia'
import { loginLock, recordLoginFailure, recordLoginSuccess } from '../../middleware/login-lock'
import { strictRateLimit } from '../../middleware/rate-limit'
import { authPlugin } from '../../plugins/auth'
import { ensureDir, generateFilename, getClientIP, getDeviceInfo, validateImage, validatePassword } from '../../utils'
import { AvatarUploadResponse, ChangePasswordRequest, CreateUser, LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse, UpdateUser, UserError, UserResponse } from './model'
import { userService } from './service'

function omitPassword(user: UserType) {
  const { password: _, ...rest } = user
  return rest
}

export function createUserRouter(database: BunSQLiteDatabase) {
  // 确保头像上传目录存在
  ensureDir('uploads/avatars')

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
    // 登录接口限流（10 请求/分钟）
    .use(strictRateLimit)
    .use(loginLock)
    .post('/login', async ({ jwt, body, status, request, server }) => {
      // 获取客户端标识用于登录失败记录
      const clientIP = getClientIP(request, server)
      const identifier = clientIP

      // 1. 根据账号（用户名/手机号/邮箱）查找用户
      const user = userService.getByAccount(database, body.account)
      if (!user) {
        recordLoginFailure(identifier)
        return status(401, { message: '账号或密码错误' })
      }

      // 2. 验证密码（密码为 null 时直接返回失败）
      if (!user.password) {
        recordLoginFailure(identifier)
        return status(401, { message: '账号或密码错误' })
      }
      const valid = await Bun.password.verify(body.password, user.password)
      if (!valid) {
        recordLoginFailure(identifier)
        return status(401, { message: '账号或密码错误' })
      }

      // 3. 登录成功，重置失败计数
      recordLoginSuccess(identifier)

      // 4. 签发 JWT token
      const token = await jwt.sign({ userId: user.id })

      // 5. 更新登录信息（设备、IP、时间）
      const deviceInfo = getDeviceInfo(request)
      userService.updateLoginInfo(database, user.id, deviceInfo, clientIP)

      return { token, user: omitPassword(user) }
    }, {
      detail: {
        summary: '用户登录',
        description: '通过账号（用户名/手机号/邮箱）和密码登录，返回 JWT token 和用户信息，并记录登录设备信息',
        tags: ['用户管理'],
      },
      body: LoginRequest,
      response: {
        200: LoginResponse,
        401: UserError,
        429: t.Object({
          success: t.Boolean(),
          message: t.String(),
          retryAfter: t.Integer(),
        }),
      },
    })
    .get('/', () => userService.getAll(database).map(omitPassword), {
      detail: {
        summary: '获取所有用户列表',
        description: '返回所有未删除的用户列表，响应中不包含密码字段',
        tags: ['用户管理'],
      },
      response: {
        200: t.Array(UserResponse),
      },
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
      params: t.Object({
        id: t.String({ description: '用户 ID' }),
      }),
      response: {
        200: UserResponse,
        404: UserError,
      },
    })
    .post('/', async ({ body, status }) => {
      // 验证密码强度
      const passwordValidation = validatePassword(body.password)
      if (!passwordValidation.valid) {
        return status(400, { message: passwordValidation.errors.join(', ') })
      }

      const user = await userService.create(database, body)
      return status(201, omitPassword(user))
    }, {
      isSignIn: true,
      detail: {
        summary: '创建用户',
        description: '创建新用户账号。用户名、手机号、邮箱至少填写一项，密码最少 8 位且包含大小写字母和数字。',
        tags: ['用户管理'],
      },
      body: CreateUser,
      response: {
        201: UserResponse,
        400: UserError,
      },
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
      params: t.Object({
        id: t.String({ description: '用户 ID' }),
      }),
      body: UpdateUser,
      response: {
        200: UserResponse,
        404: UserError,
      },
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
        description: '软删除指定用户，设置 deletedAt 时间戳。删除后用户无法登录。',
        tags: ['用户管理'],
      },
      params: t.Object({
        id: t.String({ description: '用户 ID' }),
      }),
      response: {
        200: UserResponse,
        404: UserError,
      },
    })
    // ==================== 头像上传 ====================
    .post('/avatar', async ({ jwt, bearer, status, body: { avatar } }) => {
      // 1. 验证 token 获取用户 ID
      const payload = await jwt.verify(bearer!)
      if (!payload)
        return status(401, { message: '未登录或登录已过期' })

      // 2. 验证图片文件
      const validation = validateImage(avatar)
      if (!validation.valid)
        return status(400, { message: validation.error! })

      // 3. 生成唯一文件名
      const filename = generateFilename(avatar.name, payload.userId)
      const filepath = `uploads/avatars/${filename}`

      // 4. 保存文件
      await Bun.write(filepath, avatar)

      // 5. 更新用户头像
      const avatarUrl = `/avatars/${filename}`
      const user = userService.updateAvatar(database, payload.userId, avatarUrl)
      if (!user)
        return status(404, { message: '用户不存在' })

      return { message: '头像上传成功', avatar: avatarUrl }
    }, {
      isSignIn: true,
      detail: {
        summary: '上传头像',
        description: '上传用户头像图片，支持 JPG、PNG、GIF、WebP 格式，最大 5MB。上传成功后自动更新用户头像并返回访问 URL。',
        tags: ['用户管理'],
      },
      body: t.Object({
        avatar: t.File({
          description: '头像图片文件',
        }),
      }),
      response: {
        200: AvatarUploadResponse,
        400: UserError,
        401: UserError,
        404: UserError,
      },
    })
    // ==================== 刷新 Token ====================
    .post('/refresh-token', async ({ jwt, body, status }) => {
      // 验证 refreshToken
      const { refreshToken } = body

      try {
        const payload = await jwt.verify(refreshToken)
        if (!payload || !payload.userId) {
          return status(401, { message: '无效的刷新 token' })
        }

        // 签发新的 access token
        const newToken = await jwt.sign({ userId: payload.userId })

        return {
          token: newToken,
          refreshToken, // 返回原 refreshToken
        }
      }
      catch {
        return status(401, { message: '无效的刷新 token' })
      }
    }, {
      detail: {
        summary: '刷新 Token',
        description: '使用刷新 token 获取新的 access token。当 access token 过期后，可以使用此接口无感刷新。',
        tags: ['用户管理'],
      },
      body: RefreshTokenRequest,
      response: {
        200: RefreshTokenResponse,
        401: UserError,
      },
    })
    // ==================== 修改密码 ====================
    .post('/change-password', async ({ jwt, bearer, body, status }) => {
      // 1. 验证 token 获取用户 ID
      const payload = await jwt.verify(bearer!)
      if (!payload)
        return status(401, { message: '未登录或登录已过期' })

      const { oldPassword, newPassword } = body

      // 2. 验证新密码强度
      const passwordValidation = validatePassword(newPassword)
      if (!passwordValidation.valid) {
        return status(400, { message: passwordValidation.errors.join(', ') })
      }

      // 3. 获取当前用户，验证原密码
      const user = userService.getById(database, payload.userId)
      if (!user)
        return status(404, { message: '用户不存在' })

      if (!user.password)
        return status(400, { message: '当前用户未设置密码' })

      const valid = await Bun.password.verify(oldPassword, user.password)
      if (!valid)
        return status(400, { message: '原密码错误' })

      // 4. 更新密码
      const updated = await userService.update(database, payload.userId, { password: newPassword })
      if (!updated)
        return status(404, { message: '用户不存在' })

      return { message: '密码修改成功' }
    }, {
      isSignIn: true,
      detail: {
        summary: '修改密码',
        description: '修改当前登录用户的密码。需要提供原密码，新密码必须满足密码强度要求。',
        tags: ['用户管理'],
      },
      body: ChangePasswordRequest,
      response: {
        200: t.Object({
          message: t.String({ description: '提示信息' }),
        }),
        400: UserError,
        401: UserError,
        404: UserError,
      },
    })
}
