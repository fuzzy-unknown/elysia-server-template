import { cors } from '@elysia/cors'
import { openapi } from '@elysia/openapi'
import { Elysia } from 'elysia'
import logixlysia from 'logixlysia'
import { movieModule } from './modules'

const app = new Elysia()
  // 跨域支持
  .use(cors())
  // Swagger 文档，访问 /openapi 查看
  .use(openapi())
  // 请求日志中间件
  .use(
    logixlysia({
      config: {
        service: 'voasx',
        showStartupMessage: false,
        startupMessageFormat: undefined,
        // 调试时展示请求上下文树，生产环境可关闭
        showContextTree: true,
        contextDepth: 2,
        slowThreshold: 500,
        verySlowThreshold: 1000,
        timestamp: {
          translateTime: 'yyyy-mm-dd HH:MM:ss.SSS',
        },
        ip: true,
        logFilePath: './.voasx/logs/app.log',
      },
    }),
  )
  // 所有业务接口统一挂在 /api 前缀下
  .use(new Elysia({ prefix: '/api' }).use(movieModule))
  .listen(3000)

console.log(`
http://${app.server?.hostname}:${app.server?.port}
http://${app.server?.hostname}:${app.server?.port}/openapi
`)

export default app
export type AppType = typeof app
