/** 请求日志插件 - 记录 /api 路径下的请求信息 */
import { Elysia } from 'elysia'
import { logger } from './logger'

function getClientIP(request: Request, server?: { requestIP?: (req: Request) => { address: string } | null } | null): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || server?.requestIP?.(request)?.address
    || '127.0.0.1'
  )
}

export const requestLog = new Elysia({ name: 'plugin:request-log' })
  .derive({ as: 'global' }, ({ request, server }) => ({
    startTime: performance.now(),
    clientIP: getClientIP(request, server),
  }))
  .onAfterHandle({ as: 'global' }, ({ request, params, query, body, startTime, clientIP }) => {
    const path = new URL(request.url).pathname
    if (!path.startsWith('/api'))
      return

    const duration = (performance.now() - startTime).toFixed(2)
    logger.info('请求', {
      method: request.method,
      path,
      ip: clientIP,
      params: Object.keys(params ?? {}).length ? params : undefined,
      query: Object.keys(query ?? {}).length ? query : undefined,
      body: body ?? undefined,
      duration: `${duration}ms`,
    })
  })
  .onError({ as: 'global' }, ({ request, params, query, body, error, code, startTime, clientIP }) => {
    const duration = (performance.now() - (startTime ?? performance.now())).toFixed(2)
    logger.error('请求错误', {
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
