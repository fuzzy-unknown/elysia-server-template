/**
 * 应用入口文件 - ElysiaJS + Bun + SQLite (Drizzle ORM)
 * 插件加载顺序：cors → requestLog → openapi → authPlugin → 业务模块
 */
import { cors } from '@elysia/cors'
import { openapi } from '@elysia/openapi'
import { Elysia } from 'elysia'
import { serverConfig } from './config'
import { userModule } from './modules'
import { requestLog } from './plugins/request-log'

const app = new Elysia()
  .use(cors(serverConfig.cors))
  .use(requestLog)
  .use(openapi())
  .use(new Elysia({ prefix: serverConfig.apiPrefix }).use(userModule))
  .get('/', () => 'Hello World !')
  .listen(serverConfig.port)

console.log(`
服务器地址：${app.server?.hostname}:${app.server?.port}
API 文档：${app.server?.hostname}:${app.server?.port}/openapi
`)

export default app
export type AppType = typeof app
