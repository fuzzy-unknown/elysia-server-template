/**
 * JWT 认证插件
 * 基于中间件的认证，使用 middleware/auth 作为核心实现
 */
import { authMiddleware } from '../middleware/auth'

export const authPlugin = authMiddleware
