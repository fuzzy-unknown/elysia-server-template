import process from 'node:process'
import { bearer } from '@elysia/bearer'
import { jwt } from '@elysiajs/jwt'
import { Elysia, t } from 'elysia'
import { logger } from './logger'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  console.error('错误：JWT_SECRET 未设置，请于 .env 中配置。服务无法安全启动。')
  process.exit(1)
}

export const authPlugin = new Elysia({ name: 'plugin:auth' })
  .use(bearer())
  .use(
    jwt({
      name: 'jwt',
      secret: JWT_SECRET!,
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
          if (!bearer) {
            logger.warn('认证失败: 未提供 token')
            return status(401, '未登录或登录已过期')
          }
          const payload = await jwt.verify(bearer)
          if (!payload) {
            logger.warn('认证失败: token 无效或已过期')
            return status(401, '未登录或登录已过期')
          }
          return { userId: payload.userId }
        },
      }
    },
  })
