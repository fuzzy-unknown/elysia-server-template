import { cors } from '@elysia/cors'
import { openapi } from '@elysia/openapi'
import { Elysia } from 'elysia'
import { unitModule, userModule } from './modules'
import { authPlugin } from './plugins/auth'
import { requestLog } from './plugins/request-log'

const app = new Elysia()
  // 跨域支持
  .use(cors())
  // 请求日志中间件
  .use(requestLog)
  // Swagger 文档，访问 /openapi 查看
  .use(openapi())
  // JWT 认证插件（提供 jwt 签发/验证 + isSignIn 宏）
  .use(authPlugin)
  // 所有业务接口统一挂在 /api 前缀下
  .use(new Elysia({ prefix: '/api' }).use(unitModule).use(userModule))
  .get('/', () => 'Hello World !')
  .listen(3010)

console.log(`
http://${app.server?.hostname}:${app.server?.port}
http://${app.server?.hostname}:${app.server?.port}/openapi
`)

export default app
export type AppType = typeof app
