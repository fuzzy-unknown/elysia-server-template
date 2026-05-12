/** 数据库 Schema 定义 */
import { relations } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { nanoid } from 'nanoid'

/**
 * 用户表 - 通用应用用户表
 * 支持多种登录方式（用户名/手机/邮箱），记录设备信息
 */
export const users = sqliteTable('users', {
  /** 主键，使用 nanoid 生成唯一标识 */
  id: text('id').primaryKey().$defaultFn(() => nanoid()),

  /** 用户名，用于登录，唯一 */
  username: text('username'),

  /** 手机号码，用于登录和验证，唯一 */
  phone: text('phone'),

  /** 邮箱，用于登录和通知，唯一 */
  email: text('email'),

  /** 密码（哈希加密存储），第三方登录可为空 */
  password: text('password'),

  /** 用户昵称 */
  nickname: text('nickname'),

  /** 头像 URL */
  avatar: text('avatar'),

  /** 性别：0-未知，1-男，2-女 */
  gender: integer('gender').notNull().$defaultFn(() => 0),

  /** 出生日期 */
  birthday: text('birthday'),

  /** 最后登录设备类型：ios, android, web, unknown */
  deviceType: text('device_type').notNull().$defaultFn(() => 'unknown'),

  /** 最后登录设备型号，如：iPhone 15 Pro, SM-G998B */
  deviceModel: text('device_model'),

  /** 最后登录 App 版本，如：1.0.0 */
  appVersion: text('app_version'),

  /** 最后登录操作系统版本，如：iOS 17.0, Android 14 */
  osVersion: text('os_version'),

  /** 最后登录时间 */
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),

  /** 最后登录 IP */
  lastLoginIp: text('last_login_ip'),

  /** 账号状态：true-启用，false-停用/封禁 */
  status: integer('status', { mode: 'boolean' }).notNull().$defaultFn(() => true),

  /** 创建时间 */
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),

  /** 更新时间，每次更新记录时自动刷新 */
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$onUpdateFn(() => new Date()),

  /** 软删除时间，为 null 表示未删除 */
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, table => [
  /** 用户名唯一索引 */
  uniqueIndex('idx_users_username').on(table.username),
  /** 手机号唯一索引 */
  uniqueIndex('idx_users_phone').on(table.phone),
  /** 邮箱唯一索引 */
  uniqueIndex('idx_users_email').on(table.email),
  /** 最后登录时间索引，用于查询活跃用户 */
  index('idx_users_last_login').on(table.lastLoginAt),
])

export const usersRelations = relations(users, ({}: any) => ({}))
