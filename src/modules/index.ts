/** 模块注册中心 - 工厂函数模式，自动挂载到 /api 前缀 */
import { db } from '../db'
import { createUserRouter } from './user'

export const userModule = createUserRouter(db)
