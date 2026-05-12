/** 通用类型定义 */

/** 性别枚举 */
export type Gender = 0 | 1 | 2

/** 用户状态 */
export type UserStatus = 'active' | 'inactive' | 'banned'

/** 设备类型 */
export type DeviceType = 'ios' | 'android' | 'web' | 'unknown'

/** 软删除实体基础类型 */
export interface SoftDeletable {
  deletedAt: Date | null
}

/** 时间戳实体基础类型 */
export interface Timestamps {
  createdAt: Date
  updatedAt: Date
}
