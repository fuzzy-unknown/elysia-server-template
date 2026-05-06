/**
 * 应用入口文件
 *
 * 技术栈：ElysiaJS + Bun + SQLite (Drizzle ORM)
 *
 * 全局中间件加载顺序：
 * 1. cors       —— 跨域支持
 * 2. requestLog —— 请求日志（derive + onAfterHandle + onError）
 * 3. openapi    —— Swagger API 文档（/openapi）
 *
 * 各业务模块内部通过 .use(authPlugin) 按需加载 JWT 认证
 *
 * 业务模块（/api 前缀）：unit、user、room、unit-leader、housing-application、approval-record、group
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
import { approvalRecordModule, groupModule, housingApplicationModule, roomModule, unitLeaderModule, unitModule, userModule } from './modules'
import { requestLog } from './plugins/request-log'

const app = new Elysia()
  .use(cors())
  .use(requestLog)
  // 访问 /openapi 可查看自动生成的 Swagger API 文档
  .use(openapi())
  // 业务模块统一注册到 /api 前缀下，便于前端统一代理和权限控制
  .use(new Elysia({ prefix: '/api' }).use(unitModule).use(userModule).use(roomModule).use(unitLeaderModule).use(housingApplicationModule).use(approvalRecordModule).use(groupModule))
  .get('/', () => 'Hello World !')
  .listen(3010)

console.log(`
${app.server?.hostname}:${app.server?.port}
${app.server?.hostname}:${app.server?.port}/openapi
`)

// 导出 app 实例和类型，供 Eden Treaty 等端到端类型安全客户端使用
export default app
export type AppType = typeof app
