/**
 * 登录失败限制中间件 - 防止暴力破解
 *
 * 安全策略：
 * - 连续失败 5 次后锁定账户 15 分钟
 * - 锁定期间禁止登录尝试
 * - 成功登录后重置失败计数
 *
 * 使用内存存储，生产环境建议使用 Redis
 */
import { Elysia, t } from 'elysia'
import { env } from '../config'

/** 登录失败记录 */
interface LoginFailureRecord {
  /** 失败次数 */
  count: number
  /** 锁定时间（毫秒时间戳） */
  lockedUntil?: number
  /** 最后失败时间 */
  lastFailure: number
}

/** 限流存储 */
class LoginFailureStore {
  private store = new Map<string, LoginFailureRecord>()

  get(key: string): LoginFailureRecord | undefined {
    return this.store.get(key)
  }

  set(key: string, record: LoginFailureRecord): void {
    this.store.set(key, record)
  }

  delete(key: string): boolean {
    return this.store.delete(key)
  }

  /** 清理过期记录 */
  cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (record.lockedUntil && now > record.lockedUntil) {
        this.store.delete(key)
      }
    }
  }
}

const store = new LoginFailureStore()

// 每 10 分钟清理一次
setInterval(() => store.cleanup(), 10 * 60 * 1000)

/** 配置 */
interface LoginLockConfig {
  /** 最大失败次数 */
  maxAttempts: number
  /** 锁定时长（分钟） */
  lockDurationMinutes: number
}

const defaultConfig: LoginLockConfig = {
  maxAttempts: 5,
  lockDurationMinutes: 15,
}

/**
 * 记录登录失败
 * @param identifier - 标识符（通常用 IP 或账号）
 */
export function recordLoginFailure(identifier: string): void {
  const key = `loginlock:${identifier}`
  const record = store.get(key)
  const now = Date.now()

  if (!record) {
    store.set(key, {
      count: 1,
      lastFailure: now,
    })
  }
  else if (record.lockedUntil) {
    // 已锁定，不增加计数
  }
  else {
    const newCount = record.count + 1
    if (newCount >= defaultConfig.maxAttempts) {
      // 达到最大失败次数，锁定账户
      store.set(key, {
        count: newCount,
        lockedUntil: now + defaultConfig.lockDurationMinutes * 60 * 1000,
        lastFailure: now,
      })
    }
    else {
      store.set(key, {
        ...record,
        count: newCount,
        lastFailure: now,
      })
    }
  }
}

/**
 * 记录登录成功（重置失败计数）
 * @param identifier - 标识符
 */
export function recordLoginSuccess(identifier: string): void {
  store.delete(`loginlock:${identifier}`)
}

/**
 * 获取登录失败次数
 * @param identifier - 标识符
 */
export function getLoginFailureCount(identifier: string): number {
  const record = store.get(`loginlock:${identifier}`)
  return record?.count || 0
}

/**
 * 创建登录失败限制中间件
 */
export function createLoginLock(_config: LoginLockConfig = defaultConfig) {
  return new Elysia({ name: 'middleware:login-lock' })
    .onRequest(({ request, set, status }) => {
      // 测试环境下跳过限制
      if (env.NODE_ENV === 'test') {
        return
      }

      // 只检查登录接口
      const url = new URL(request.url)
      if (!url.pathname.endsWith('/login')) {
        return
      }

      // 获取客户端标识（IP + UserAgent 指纹）
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
        || request.headers.get('x-real-ip')
        || 'unknown'
      const ua = request.headers.get('user-agent') || ''
      const key = `loginlock:${ip}:${ua}`

      const record = store.get(key)
      const now = Date.now()

      // 检查是否被锁定
      if (record?.lockedUntil && now < record.lockedUntil) {
        const remaining = Math.ceil((record.lockedUntil - now) / 1000)
        set.headers['Retry-After'] = remaining.toString()

        return status(429, {
          success: false,
          message: `账户已锁定，请 ${remaining} 秒后重试`,
          retryAfter: remaining,
        })
      }

      // 锁定已过期，重置记录
      if (record?.lockedUntil && now >= record.lockedUntil) {
        store.delete(key)
      }
    })
}

/** 登录锁定中间件实例 */
export const loginLock = createLoginLock()

/** 登录锁定响应类型 */
export const LoginLockError = t.Object({
  success: t.Boolean({ example: false }),
  message: t.String({ example: '账户已锁定，请 900 秒后重试' }),
  retryAfter: t.Integer({ description: '重试等待时间（秒）', example: 900 }),
})

export type LoginLockErrorType = typeof LoginLockError.static
