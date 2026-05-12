/**
 * 应用入口文件 - ElysiaJS + Bun + SQLite (Drizzle ORM)
 * 插件加载顺序：cors → requestLog → 业务模块 → openapi → 静态文件
 */
import { cors } from '@elysia/cors'
import { openapi } from '@elysia/openapi'
import { staticPlugin } from '@elysia/static'
import { Elysia } from 'elysia'
import { serverConfig } from './config'
import { userModule } from './modules'
import { healthModule } from './modules/health'
import { requestLog } from './plugins/request-log'

const app = new Elysia()
  .use(cors(serverConfig.cors))
  .use(requestLog)
  // 健康检查接口（不需要认证，前缀 /health）
  .use(healthModule)
  .use(new Elysia({ prefix: serverConfig.apiPrefix }).use(userModule))
  // OpenAPI 文档（只文档化 API 路由）
  .use(openapi())
  // 静态文件服务（在 openapi 之后注册，不会被文档化）
  .use(
    staticPlugin({
      assets: 'uploads/avatars',
      prefix: '/avatars',
    }),
  )
  .get('/', () => 'Hello World !')
  .listen(serverConfig.port)

console.log(`
http://${app.server?.hostname}:${app.server?.port}
http://${app.server?.hostname}:${app.server?.port}/openapi
`)

export default app
export type AppType = typeof app
