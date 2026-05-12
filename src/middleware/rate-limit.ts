/**
 * 限流中间件 - 基于 IP 的请求频率限制
 *
 * 防止 API 滥用、DDoS 攻击、短信轰炸
 *
 * 限流策略：
 * - 默认：60 请求/分钟
 * - 登录接口：10 请求/分钟
 * - 注册接口：5 请求/分钟
 *
 * 超出限制返回 429 Too Many Requests
 */
import { Elysia, t } from 'elysia'
import { env } from '../config'

/** 限流配置 */
interface RateLimitConfig {
  /** 时间窗口（毫秒） */
  windowMs: number
  /** 时间窗口内最大请求数 */
  max: number
  /** 自定义消息 */
  message?: string
}

/** 限流记录 */
interface RateLimitRecord {
  count: number
  resetTime: number
}

/** 限流存储 - 使用 Map 存储内存数据 */
class RateLimitStore {
  private store = new Map<string, RateLimitRecord>()

  get(key: string): RateLimitRecord | undefined {
    return this.store.get(key)
  }

  set(key: string, record: RateLimitRecord): void {
    this.store.set(key, record)
  }

  delete(key: string): boolean {
    return this.store.delete(key)
  }

  /** 清理过期记录 */
  cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

/** 全局限流存储实例 */
const store = new RateLimitStore()

/** 定时清理过期记录（每 5 分钟） */
setInterval(() => store.cleanup(), 5 * 60 * 1000)

/**
 * 创建限流中间件
 */
export function createRateLimit(config: RateLimitConfig) {
  return new Elysia({ name: 'middleware:rate-limit' })
    .onRequest(({ request, status, set }) => {
      // 测试环境下跳过限流
      if (env.NODE_ENV === 'test') {
        return
      }

      // 获取客户端 IP
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
        || request.headers.get('x-real-ip')
        || 'unknown'

      const key = `ratelimit:${ip}`
      const now = Date.now()
      const record = store.get(key)

      // 如果没有记录或已过期，创建新记录
      if (!record || now > record.resetTime) {
        store.set(key, {
          count: 1,
          resetTime: now + config.windowMs,
        })
        return
      }

      // 检查是否超出限制
      if (record.count >= config.max) {
        set.headers['X-RateLimit-Limit'] = config.max.toString()
        set.headers['X-RateLimit-Remaining'] = '0'
        set.headers['X-RateLimit-Reset'] = Math.ceil(record.resetTime / 1000).toString()
        set.headers['Retry-After'] = Math.ceil((record.resetTime - now) / 1000).toString()

        return status(429, {
          success: false,
          message: config.message || '请求过于频繁，请稍后再试',
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        })
      }

      // 增加计数
      record.count++
      store.set(key, record)

      // 设置响应头
      set.headers['X-RateLimit-Limit'] = config.max.toString()
      set.headers['X-RateLimit-Remaining'] = (config.max - record.count).toString()
      set.headers['X-RateLimit-Reset'] = Math.ceil(record.resetTime / 1000).toString()
    })
}

/** 通用限流配置 */
export const rateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 60, // 60 请求/分钟
  message: '请求过于频繁，请稍后再试',
})

/** 严格限流配置 - 用于登录等敏感接口 */
export const strictRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 分钟
  max: 10, // 10 请求/分钟
  message: '操作过于频繁，请休息一会儿',
})

/** 限流响应类型 */
export const RateLimitError = t.Object({
  success: t.Boolean({ example: false }),
  message: t.String({ example: '请求过于频繁，请稍后再试' }),
  retryAfter: t.Integer({ description: '重试等待时间（秒）', example: 30 }),
})

export type RateLimitErrorType = typeof RateLimitError.static
