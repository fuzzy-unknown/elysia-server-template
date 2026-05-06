/**
 * 模块注册中心
 *
 * 每个业务模块采用工厂函数模式：createXxxRouter(db)
 * - 接收数据库实例作为参数，内部创建对应的 Service 并绑定路由
 * - 模块内部遵循三层架构：index.ts（路由层）→ service.ts（业务层）→ schema.ts（数据层）
 * - 新增模块时，在此处注册即可自动挂载到 /api 前缀下
 */
import { db } from '../db'
import { createApprovalRecordRouter } from './approval-record'
import { createHousingApplicationRouter } from './housing-application'
import { createRoomRouter } from './room'
import { createUnitRouter } from './unit'
import { createUnitLeaderRouter } from './unit-leader'
import { createUserRouter } from './user'

export const approvalRecordModule = createApprovalRecordRouter(db)
export const housingApplicationModule = createHousingApplicationRouter(db)
export const roomModule = createRoomRouter(db)
export const unitLeaderModule = createUnitLeaderRouter(db)
export const unitModule = createUnitRouter(db)
export const userModule = createUserRouter(db)
