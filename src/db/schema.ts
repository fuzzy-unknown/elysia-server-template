import { relations } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { nanoid } from 'nanoid'

/**
 * 单位表（树形结构）
 * 管理用户所属的组织/单位信息，支持多级层级
 * - 通过 parentId 实现自引用，构建父子树结构
 * - 顶级单位的 parentId 为 null
 */
export const units = sqliteTable('units', {
  /** 主键，使用 nanoid 生成唯一标识 */
  id: text('id').primaryKey().$defaultFn(() => nanoid()),

  /** 单位名称（全称），如：XX市志愿者协会 */
  name: text('name').notNull(),

  /** 单位简称，如：市志愿协 */
  shortName: text('short_name').notNull(),

  /** 父级单位 ID，null 表示顶级单位 */
  parentId: text('parent_id').references((): any => units.id),

  /** 单位状态：1-启用，0-停用 */
  status: integer('status', { mode: 'boolean' }).notNull().$defaultFn(() => true),

  /** 备注 */
  remark: text('remark'),

  /** 创建时间 */
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),

  /** 更新时间，每次更新记录时自动刷新 */
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$onUpdateFn(() => new Date()),

  /** 软删除时间，为 null 表示未删除 */
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
})

/**
 * 用户表
 * 存储系统用户的基本信息及账号状态
 *
 * 关联关系：
 * - unitId → units.id：用户所属单位
 */
export const users = sqliteTable('users', {
  /** 主键，使用 nanoid 生成唯一标识 */
  id: text('id').primaryKey().$defaultFn(() => nanoid()),

  /** 用户名，用于登录，唯一 */
  username: text('username').notNull(),

  /** 密码（哈希加密存储） */
  password: text('password').notNull(),

  /** 身份证号码，18位，唯一 */
  idCard: text('id_card'),

  /** 所属单位 ID，关联 units 表 */
  unitId: text('unit_id').references(() => units.id),

  /**
   * 评定等级
   * 如：'A'、'B'、'C'、'D' 等级，或自定义等级名称
   */
  level: text('level'),

  /**
   * 账号状态：true-启用，false-停用
   * 停用后用户无法登录系统
   */
  status: integer('status', { mode: 'boolean' }).notNull().$defaultFn(() => true),

  /** 备注 */
  remark: text('remark'),

  /** 创建时间 */
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),

  /** 更新时间，每次更新记录时自动刷新 */
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$onUpdateFn(() => new Date()),

  /** 软删除时间，为 null 表示未删除 */
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, table => [
  /** 用户名唯一索引，防止重复注册 */
  uniqueIndex('idx_users_username').on(table.username),
  /** 身份证号唯一索引，防止重复录入 */
  uniqueIndex('idx_users_id_card').on(table.idCard),
  /** 单位 ID 索引，加速按单位查询用户 */
  index('idx_users_unit_id').on(table.unitId),
])

/**
 * 单位关联关系
 * - 一个单位 拥有 多个用户（一对多）
 * - 一个单位 拥有 多个子单位（一对多，自引用）
 * - 一个单位 属于 一个父级单位（多对一，自引用）
 */
export const unitsRelations = relations(units, ({ many, one }) => ({
  /** 单位下的所有用户 */
  users: many(users),
  /** 父级单位（自引用多对一） */
  parent: one(units, {
    fields: [units.parentId],
    references: [units.id],
    relationName: 'unitHierarchy',
  }),
  /** 子单位列表（自引用一对多） */
  children: many(units, {
    relationName: 'unitHierarchy',
  }),
}))

/**
 * 用户关联关系
 * - 一个用户 属于 一个单位（多对一）
 */
export const usersRelations = relations(users, ({ one }) => ({
  unit: one(units, {
    fields: [users.unitId],
    references: [units.id],
  }),
}))
