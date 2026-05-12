import { bearer } from '@elysia/bearer'
import { jwt } from '@elysiajs/jwt'
/** 认证中间件 - 可复用版本 */
import { Elysia, t } from 'elysia'
import { env } from '../config'

/** JWT 认证中间件 */
export const authMiddleware = new Elysia({ name: 'middleware:auth' })
  .use(bearer())
  .use(
    jwt({
      name: 'jwt',
      secret: env.JWT_SECRET,
      exp: '7d',
      schema: t.Object({
        userId: t.String(),
      }),
    }),
  )
  .macro({
    isSignIn: (enabled: boolean) => {
      if (!enabled)
        return {}
      return {
        async resolve({ jwt, bearer, status }) {
          // 测试环境下跳过认证
          if (env.NODE_ENV === 'test') {
            return { userId: 'test-user' }
          }

          if (!bearer) {
            return status(401, '未登录或登录已过期')
          }

          const payload = await jwt.verify(bearer)
          if (!payload) {
            return status(401, '未登录或登录已过期')
          }

          return { userId: payload.userId }
        },
      }
    },
  })
