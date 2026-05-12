/** 环境变量配置 */
import process from 'node:process'

/** 环境变量验证 */
export const env = {
  /** JWT 密钥 */
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-for-development',

  /** 服务器端口 */
  PORT: Number.parseInt(process.env.PORT || '3010', 10),

  /** 运行环境 */
  NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
}

/** 验证环境变量是否配置正确 */
export function validateEnv(): void {
  if (!process.env.JWT_SECRET && env.NODE_ENV !== 'test') {
    console.warn('警告：JWT_SECRET 未设置，使用默认值（仅开发环境允许）')
  }
}
