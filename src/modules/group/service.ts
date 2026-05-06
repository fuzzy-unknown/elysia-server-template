/**
 * 组服务层
 *
 * 处理组的 CRUD 以及用户 - 组关联管理。
 */
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import type { CreateGroupType, UpdateGroupType } from './model'
import { and, eq, isNull } from 'drizzle-orm'
import { groups, userGroups } from '../../db/schema'

type GroupRow = typeof groups.$inferSelect
type UserGroupRow = typeof userGroups.$inferSelect

export class GroupService {
  constructor(private db: BunSQLiteDatabase) {}

  // ==================== 组 CRUD ====================

  /** 获取所有组 */
  getAll(): GroupRow[] {
    return this.db.select().from(groups).where(isNull(groups.deletedAt)).all()
  }

  /** 根据 ID 获取组 */
  getById(id: string): GroupRow | null {
    return this.db.select().from(groups).where(and(eq(groups.id, id), isNull(groups.deletedAt))).get() ?? null
  }

  /** 创建组 */
  create(createdBy: string, data: CreateGroupType): GroupRow {
    return this.db.insert(groups).values({ ...data, createdBy }).returning().get()!
  }

  /** 更新组 */
  update(id: string, data: UpdateGroupType): GroupRow | null {
    return this.db.update(groups).set({ ...data, updatedAt: new Date() }).where(and(eq(groups.id, id), isNull(groups.deletedAt))).returning().get() ?? null
  }

  /** 删除组（软删除） */
  remove(id: string): GroupRow | null {
    return this.db.update(groups).set({ deletedAt: new Date(), updatedAt: new Date() }).where(and(eq(groups.id, id), isNull(groups.deletedAt))).returning().get() ?? null
  }

  // ==================== 组成员管理 ====================

  /** 获取组的所有成员 */
  getMembers(groupId: string): UserGroupRow[] {
    return this.db.select().from(userGroups).where(and(eq(userGroups.groupId, groupId), isNull(userGroups.deletedAt))).all()
  }

  /** 获取用户的所有组 */
  getUserGroups(userId: string): UserGroupRow[] {
    return this.db.select().from(userGroups).where(and(eq(userGroups.userId, userId), isNull(userGroups.deletedAt))).all()
  }

  /** 添加用户到组 */
  addMember(groupId: string, userId: string, role?: string): UserGroupRow {
    return this.db.insert(userGroups).values({ groupId, userId, role }).returning().get()!
  }

  /** 更新用户在组中的角色 */
  updateMemberRole(groupId: string, userId: string, role: string): UserGroupRow | null {
    return this.db.update(userGroups).set({ role, updatedAt: new Date() }).where(and(eq(userGroups.groupId, groupId), eq(userGroups.userId, userId), isNull(userGroups.deletedAt))).returning().get() ?? null
  }

  /** 从组中移除用户（软删除） */
  removeMember(groupId: string, userId: string): UserGroupRow | null {
    return this.db.update(userGroups).set({ deletedAt: new Date() }).where(and(eq(userGroups.groupId, groupId), eq(userGroups.userId, userId), isNull(userGroups.deletedAt))).returning().get() ?? null
  }
}
