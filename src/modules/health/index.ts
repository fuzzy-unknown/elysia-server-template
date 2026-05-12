/**
 * 系统健康检查路由
 * 提供运维监控、负载均衡器健康检查接口
 */
import { Elysia, t } from 'elysia'
import { checkDbConnection } from '../../db'

export const healthModule = new Elysia({ prefix: '/health' })
  .get('/', () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  }), {
    detail: {
      summary: '健康检查',
      description: '检查服务运行状态，返回健康状态和时间戳',
      tags: ['系统监控'],
    },
    response: {
      200: t.Object({
        status: t.String({ description: '健康状态', example: 'healthy' }),
        timestamp: t.String({ description: '检查时间', example: '2026-05-12T10:00:00.000Z' }),
      }),
    },
  })
  .get('/db', () => {
    const isConnected = checkDbConnection()
    return {
      status: isConnected ? 'healthy' : 'unhealthy',
      database: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    }
  }, {
    detail: {
      summary: '数据库健康检查',
      description: '检查数据库连接状态',
      tags: ['系统监控'],
    },
    response: {
      200: t.Object({
        status: t.String({ description: '健康状态' }),
        database: t.String({ description: '数据库连接状态' }),
        timestamp: t.String({ description: '检查时间' }),
      }),
    },
  })
