/**
 * JWT 认证插件
 *
 * 本插件为 Elysia 应用提供两个核心能力：
 *
 * 1. JWT 实例（jwt）
 *    - 通过 @elysiajs/jwt 注册，在路由中可通过 { jwt } 解构使用
 *    - jwt.sign(payload)  签发 token
 *    - jwt.verify(token)  验证 token，返回 payload 或 false
 *    - token 有效期 7 天（exp: '7d'）
 *    - payload 结构：{ userId: string }
 *
 * 2. isSignIn 宏（macro）
 *    - Elysia macro 允许在路由定义中声明自定义属性，框架会自动调用对应的 resolve
 *    - 在路由配置中添加 isSignIn: true 即可启用认证守卫
 *    - 执行流程：
 *      a. 从请求头提取 Bearer token（依赖 @elysia/bearer）
 *      b. 调用 jwt.verify() 验证 token 有效性
 *      c. 验证通过 → 将 userId 注入路由上下文，后续处理函数可直接使用
 *      d. 验证失败 → 返回 401 状态码，终止请求
 *
 * 使用示例（在路由中）：
 *   .get('/profile', ({ userId }) => ..., { isSignIn: true })
 *
 * 环境变量依赖：
 *   JWT_SECRET —— 必须在 .env 文件中配置，否则服务拒绝启动
 */
import process from 'node:process'
import { bearer } from '@elysia/bearer'
import { jwt } from '@elysiajs/jwt'
import { Elysia, t } from 'elysia'
import { logger } from './logger'

const JWT_SECRET = process.env.JWT_SECRET

// 安全检查：JWT_SECRET 是签发和验证 token 的密钥，必须配置
if (!JWT_SECRET) {
  console.error('错误：JWT_SECRET 未设置，请于 .env 中配置。服务无法安全启动。')
  process.exit(1)
}

// 插件命名 plugin:auth，确保在 Elysia 生命周期中唯一注册一次
export const authPlugin = new Elysia({ name: 'plugin:auth' })
  // 解析 Authorization: Bearer <token> 头，将 token 存入 context.bearer
  .use(bearer())
  // 注册 JWT 实例，注入到 context.jwt
  .use(
    jwt({
      name: 'jwt',
      secret: JWT_SECRET!,
      exp: '7d',
      // 定义 token payload 的类型结构，启用类型推断
      schema: t.Object({
        userId: t.String(),
      }),
    }),
  )
  /**
   * 自定义宏 isSignIn
   *
   * macro 是 Elysia 的元编程机制，允许在路由选项中声明自定义布尔属性。
   * 当路由配置 isSignIn: true 时，框架会自动执行返回的 resolve 函数，
   * 在请求处理前进行认证检查。
   *
   * 返回值说明：
   * - {} 空对象 → 不做任何处理（isSignIn: false 时）
   * - { resolve } → 在请求处理前执行的守卫函数
   */
  .macro({
    isSignIn: (enabled: boolean) => {
      if (!enabled)
        return {}
      return {
        async resolve({ jwt, bearer, status }) {
          // 检查是否提供了 Bearer token
          if (!bearer) {
            logger.warn('认证失败: 未提供 token')
            return status(401, '未登录或登录已过期')
          }
          // 验证 token 签名和有效期
          const payload = await jwt.verify(bearer)
          if (!payload) {
            logger.warn('认证失败: token 无效或已过期')
            return status(401, '未登录或登录已过期')
          }
          // 认证通过，将 userId 注入上下文供后续路由使用
          return { userId: payload.userId }
        },
      }
    },
  })
