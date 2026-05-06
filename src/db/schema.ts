import { relations } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { nanoid } from 'nanoid'

// ==================== 表定义 ====================

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
 * 房间表
 * 管理临时住房的房间信息
 *
 * roomType 房间类型：
 * - 'single'  单人房
 * - 'double'  双人房
 * - 'luxury'  豪华房
 *
 * status 房间状态：
 * - 'in_use'      使用中
 * - 'idle'        空闲
 * - 'maintenance' 维修中
 */
export const rooms = sqliteTable('rooms', {
  /** 主键，使用 nanoid 生成唯一标识 */
  id: text('id').primaryKey().$defaultFn(() => nanoid()),

  /** 房间号，唯一标识一间房，如：'301'、'A-1201' */
  roomNumber: text('room_number').notNull(),

  /** 房间类型：single-单人房，double-双人房，luxury-豪华房 */
  roomType: text('room_type', { enum: ['single', 'double', 'luxury'] }).notNull(),

  /** 房间状态：in_use-使用中，idle-空闲，maintenance-维修中 */
  status: text('room_status', { enum: ['in_use', 'idle', 'maintenance'] }).notNull().$defaultFn(() => 'idle'),

  /** 创建时间 */
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),

  /** 更新时间，每次更新记录时自动刷新 */
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$onUpdateFn(() => new Date()),

  /** 软删除时间，为 null 表示未删除 */
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, table => [
  /** 房间号唯一索引，防止重复录入 */
  uniqueIndex('idx_rooms_room_number').on(table.roomNumber),
])

/**
 * 单位负责人中间表（单位 ↔ 用户 多对多）
 *
 * 一个单位可以有多个负责人，通过 sort 字段排序体现地位高低：
 * - sort=0  第一负责人（正职）
 * - sort=1  第二负责人（副职）
 * - sort=2  第三负责人
 * - ...以此类推
 */
export const unitLeaders = sqliteTable('unit_leaders', {
  /** 主键，使用 nanoid 生成唯一标识 */
  id: text('id').primaryKey().$defaultFn(() => nanoid()),

  /** 所属单位 ID */
  unitId: text('unit_id').references(() => units.id).notNull(),

  /** 负责人用户 ID */
  userId: text('user_id').references(() => users.id).notNull(),

  /** 排序，数值越小地位越高，默认 0 */
  sort: integer('sort').notNull().$defaultFn(() => 0),

  /** 创建时间 */
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),

  /** 更新时间，每次更新记录时自动刷新 */
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$onUpdateFn(() => new Date()),

  /** 软删除时间，为 null 表示未删除 */
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, table => [
  /** 同一单位内不能重复指定同一用户为负责人 */
  uniqueIndex('idx_unit_leaders_unit_user').on(table.unitId, table.userId),
  /** 加速按单位查询负责人 */
  index('idx_unit_leaders_unit_id').on(table.unitId),
  /** 加速按用户查询其负责的单位 */
  index('idx_unit_leaders_user_id').on(table.userId),
])

// ==================== 关联关系 ====================

/**
 * 单位关联关系
 * - 一个单位 拥有 多个用户（一对多）
 * - 一个单位 拥有 多个子单位（一对多，自引用）
 * - 一个单位 属于 一个父级单位（多对一，自引用）
 * - 一个单位 拥有 多个负责人（通过 unit_leaders 中间表）
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
  /** 单位的负责人列表 */
  leaders: many(unitLeaders),
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

/**
 * 负责人记录关联关系
 * - 每条负责人记录 属于 一个单位（多对一）
 * - 每条负责人记录 关联 一个用户（多对一）
 */
export const unitLeadersRelations = relations(unitLeaders, ({ one }) => ({
  unit: one(units, {
    fields: [unitLeaders.unitId],
    references: [units.id],
  }),
  user: one(users, {
    fields: [unitLeaders.userId],
    references: [users.id],
  }),
}))

/**
 * 住房申请表
 *
 * 状态流转：
 * pending → approved（审批通过，待分配房间）→ completed（已分配房间）
 *       → rejected（被驳回）
 *       → cancelled（申请人主动取消）
 */
export const housingApplications = sqliteTable('housing_applications', {
  /** 主键，使用 nanoid 生成唯一标识 */
  id: text('id').primaryKey().$defaultFn(() => nanoid()),

  /** 申请人 ID */
  applicantId: text('applicant_id').references(() => users.id).notNull(),

  /** 申请原因 */
  reason: text('reason').notNull(),

  /** 入住时间 */
  checkInDate: integer('check_in_date', { mode: 'timestamp' }).notNull(),

  /** 离开时间 */
  checkOutDate: integer('check_out_date', { mode: 'timestamp' }).notNull(),

  /** 分配的房间 ID（审批通过后手动分配） */
  roomId: text('room_id').references(() => rooms.id),

  /** 申请状态 */
  status: text('status', { enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'] }).notNull().$defaultFn(() => 'pending'),

  /** 备注 */
  remark: text('remark'),

  /** 创建时间 */
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),

  /** 更新时间 */
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$onUpdateFn(() => new Date()),

  /** 软删除时间 */
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, table => [
  /** 加速按申请人查询 */
  index('idx_housing_applications_applicant_id').on(table.applicantId),
  /** 加速按房间查询 */
  index('idx_housing_applications_room_id').on(table.roomId),
  /** 加速按状态查询 */
  index('idx_housing_applications_status').on(table.status),
])

/**
 * 审批记录表
 *
 * 状态流转：
 * pending → approved / rejected
 */
export const approvalRecords = sqliteTable('approval_records', {
  /** 主键，使用 nanoid 生成唯一标识 */
  id: text('id').primaryKey().$defaultFn(() => nanoid()),

  /** 关联申请 ID */
  applicationId: text('application_id').references(() => housingApplications.id).notNull(),

  /** 审批步骤（1=直属单位，2=上级单位） */
  step: integer('step').notNull(),

  /** 目标审批单位 ID */
  targetUnitId: text('target_unit_id').references(() => units.id).notNull(),

  /** 实际审批人 ID（审批时填入） */
  approverId: text('approver_id').references(() => users.id),

  /** 审批状态 */
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().$defaultFn(() => 'pending'),

  /** 审批意见 */
  comment: text('comment'),

  /** 审批时间 */
  approvedAt: integer('approved_at', { mode: 'timestamp' }),

  /** 创建时间 */
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),

  /** 更新时间 */
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$onUpdateFn(() => new Date()),

  /** 软删除时间 */
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, table => [
  /** 加速按申请查询审批记录 */
  index('idx_approval_records_application_id').on(table.applicationId),
  /** 加速按审批单位查询 */
  index('idx_approval_records_target_unit_id').on(table.targetUnitId),
  /** 加速按审批人查询 */
  index('idx_approval_records_approver_id').on(table.approverId),
  /** 联合索引：同一申请的同一审批步骤只有一条记录 */
  uniqueIndex('idx_approval_records_app_step').on(table.applicationId, table.step),
])

// ==================== 关联关系（补充） ====================

/**
 * 住房申请关联关系
 * - 每个申请 属于 一个申请人（多对一）
 * - 每个申请 关联 一个房间（多对一，可选）
 * - 每个申请 拥有 多条审批记录（一对多）
 */
export const housingApplicationsRelations = relations(housingApplications, ({ one, many }) => ({
  applicant: one(users, {
    fields: [housingApplications.applicantId],
    references: [users.id],
  }),
  room: one(rooms, {
    fields: [housingApplications.roomId],
    references: [rooms.id],
  }),
  approvalRecords: many(approvalRecords),
}))

/**
 * 审批记录关联关系
 * - 每条记录 属于 一个申请（多对一）
 * - 每条记录 属于 一个审批单位（多对一）
 * - 每条记录 属于 一个审批人（多对一，可选）
 */
export const approvalRecordsRelations = relations(approvalRecords, ({ one }) => ({
  application: one(housingApplications, {
    fields: [approvalRecords.applicationId],
    references: [housingApplications.id],
  }),
  targetUnit: one(units, {
    fields: [approvalRecords.targetUnitId],
    references: [units.id],
  }),
  approver: one(users, {
    fields: [approvalRecords.approverId],
    references: [users.id],
  }),
}))

/**
 * 组表
 *
 * 组是临时性的用户集合，用于跨单位协作或项目管理。
 * 一个用户可以属于多个组（多对多关系）。
 */
export const groups = sqliteTable('groups', {
  /** 主键，使用 nanoid 生成唯一标识 */
  id: text('id').primaryKey().$defaultFn(() => nanoid()),

  /** 组名称 */
  name: text('name').notNull(),

  /** 组描述 */
  description: text('description'),

  /** 创建者 ID */
  createdBy: text('created_by').references(() => users.id).notNull(),

  /** 组状态：true-启用，false-停用 */
  status: integer('status', { mode: 'boolean' }).notNull().$defaultFn(() => true),

  /** 创建时间 */
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),

  /** 更新时间 */
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$onUpdateFn(() => new Date()),

  /** 软删除时间 */
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, table => [
  /** 加速按名称查询 */
  index('idx_groups_name').on(table.name),
  /** 加速按创建者查询 */
  index('idx_groups_created_by').on(table.createdBy),
])

/**
 * 用户 - 组关联表（多对多中间表）
 *
 * 一个用户可以属于多个组，一个组可以包含多个用户。
 */
export const userGroups = sqliteTable('user_groups', {
  /** 主键，使用 nanoid 生成唯一标识 */
  id: text('id').primaryKey().$defaultFn(() => nanoid()),

  /** 用户 ID */
  userId: text('user_id').references(() => users.id).notNull(),

  /** 组 ID */
  groupId: text('group_id').references(() => groups.id).notNull(),

  /** 角色/头衔（可选），如：组长、成员 */
  role: text('role'),

  /** 加入时间 */
  joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),

  /** 创建时间 */
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),

  /** 软删除时间，为 null 表示在组内 */
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, table => [
  /** 联合唯一索引：同一用户在同一组中只能有一条记录 */
  uniqueIndex('idx_user_groups_user_group').on(table.userId, table.groupId),
  /** 加速按用户查询其所属组 */
  index('idx_user_groups_user_id').on(table.userId),
  /** 加速按组查询其成员 */
  index('idx_user_groups_group_id').on(table.groupId),
])

// ==================== 关联关系（补充） ====================

/**
 * 组关联关系
 * - 每个组 属于 一个创建者（多对一）
 * - 每个组 拥有 多个用户（通过 user_groups 中间表，一对多）
 */
export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, {
    fields: [groups.createdBy],
    references: [users.id],
  }),
  members: many(userGroups),
}))

/**
 * 用户 - 组关联关系
 * - 每条记录 属于 一个用户（多对一）
 * - 每条记录 属于 一个组（多对一）
 */
export const userGroupsRelations = relations(userGroups, ({ one }) => ({
  user: one(users, {
    fields: [userGroups.userId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [userGroups.groupId],
    references: [groups.id],
  }),
}))
