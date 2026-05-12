/** 服务器配置 */
export const serverConfig = {
  /** 服务器端口 */
  port: 3010,

  /** API 前缀 默认：/api */
  apiPrefix: '/api',

  /** CORS 配置 */
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },

  /** JWT 配置 */
  jwt: {
    exp: '7d' as const,
  },
}
