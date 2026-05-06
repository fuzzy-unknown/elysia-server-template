/**
 * 应用入口文件
 *
 * 技术栈：ElysiaJS + Bun + SQLite (Drizzle ORM)
 *
 * 插件加载顺序（重要：顺序决定了中间件的执行链）：
 * 1. cors     —— 跨域支持，允许前端跨域访问 API
 * 2. requestLog —— 请求日志，记录每个 API 请求的方法、路径、耗时等信息
 * 3. openapi  —— Swagger 文档，自动根据路由和 TypeScript 类型生成 API 文档
 * 4. authPlugin —— JWT 认证，提供 jwt 签发/验证能力和 isSignIn 宏用于路由守卫
 * 5. 业务模块 —— 所有业务路由统一挂在 /api 前缀下，按模块组织（unit、user）
 *
 * 项目结构：
 *   src/
 *   ├── db/          数据库配置、迁移、Schema 定义
 *   ├── modules/     业务模块（每个模块包含路由、模型、服务三层）
 *   ├── plugins/     全局插件（认证、日志等）
 *   └── index.ts     本文件，应用启动入口
 */
import { cors } from '@elysia/cors'
import { openapi } from '@elysia/openapi'
import { Elysia } from 'elysia'
import { unitModule, userModule } from './modules'
import { requestLog } from './plugins/request-log'

const app = new Elysia()
  .use(cors())
  .use(requestLog)
  // 访问 /openapi 可查看自动生成的 Swagger API 文档
  .use(openapi())
  // 业务模块统一注册到 /api 前缀下，便于前端统一代理和权限控制
  .use(new Elysia({ prefix: '/api' }).use(unitModule).use(userModule))
  .get('/', () => 'Hello World !')
  .listen(3010)

console.log(`
${app.server?.hostname}:${app.server?.port}
${app.server?.hostname}:${app.server?.port}/openapi
`)

// 导出 app 实例和类型，供 Eden Treaty 等端到端类型安全客户端使用
export default app
export type AppType = typeof app
