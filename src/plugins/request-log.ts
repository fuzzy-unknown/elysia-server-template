/**
 * 请求日志插件
 *
 * 基于 Elysia 生命周期钩子，自动记录所有 /api 路径下的请求信息。
 *
 * 三个阶段：
 * 1. derive（全局）—— 在请求处理前注入 startTime 和 clientIP 到上下文
 * 2. onAfterHandle（全局）—— 请求成功完成后记录信息日志
 *    - 记录内容：method、path、IP、params、query、body、耗时
 * 3. onError（全局）—— 请求处理出错时记录错误日志
 *    - 额外记录：HTTP 状态码、错误消息、堆栈信息
 *
 * 非 /api 路径的请求（如根路由 /、/openapi）不记录日志，减少噪音
 */
import { Elysia } from 'elysia'
import { logger } from './logger'

/**
 * 提取客户端真实 IP 地址
 * 优先级：x-forwarded-for（代理场景） > x-real-ip（Nginx） > Bun 原生 requestIP > 回退到 127.0.0.1
 */
function getClientIP(request: Request, server?: { requestIP?: (req: Request) => { address: string } | null } | null): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || server?.requestIP?.(request)?.address
    || '127.0.0.1'
  )
}

/**
 * 请求日志插件
 * - derive: 记录请求开始时间、客户端 IP
 * - onAfterHandle: 记录请求完成日志（method、path、IP、参数、耗时）
 * - onError: 记录错误日志（含错误堆栈）
 */
// 插件命名 plugin:request-log，确保全局只注册一次
export const requestLog = new Elysia({ name: 'plugin:request-log' })
  // 在请求上下文中注入 startTime（高精度时间戳）和 clientIP
  .derive({ as: 'global' }, ({ request, server }) => ({
    startTime: performance.now(),
    clientIP: getClientIP(request, server),
  }))
  // 请求成功完成后记录日志
  .onAfterHandle({ as: 'global' }, ({ request, params, query, body, response, startTime, clientIP }) => {
    const path = new URL(request.url).pathname
    // 只记录 /api 路径的请求，跳过根路由和文档路由，减少日志噪音
    if (!path.startsWith('/api'))
      return response

    // 计算请求耗时（毫秒），从 derive 注入的 startTime 开始计时
    const duration = (performance.now() - startTime).toFixed(2)
    logger.info('Request', {
      method: request.method,
      path,
      ip: clientIP,
      params: Object.keys(params ?? {}).length ? params : undefined,
      query: Object.keys(query ?? {}).length ? query : undefined,
      body: body ?? undefined,
      duration: `${duration}ms`,
    })
  })
  // 请求处理出错时记录错误日志，包含错误堆栈信息
  .onError({ as: 'global' }, ({ request, params, query, body, error, code, startTime, clientIP }) => {
    const duration = (performance.now() - (startTime ?? performance.now())).toFixed(2)
    logger.error('Request Error', {
      method: request.method,
      path: new URL(request.url).pathname,
      ip: clientIP,
      params: Object.keys(params ?? {}).length ? params : undefined,
      query: Object.keys(query ?? {}).length ? query : undefined,
      body: body ?? undefined,
      code,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
    })
  })
