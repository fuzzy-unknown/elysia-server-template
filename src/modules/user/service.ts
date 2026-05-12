/** 用户管理服务层 - 封装用户相关的数据库操作 */
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import type { CreateUserType, UpdateUserType } from './model'
import { and, eq, isNull, or } from 'drizzle-orm'
import { users } from '../../db/schema'

type UserRow = typeof users.$inferSelect

interface DeviceInfo {
  deviceType: string
  deviceModel?: string | null
  appVersion?: string | null
  osVersion?: string | null
}

export const userService = {
  getAll(db: BunSQLiteDatabase): UserRow[] {
    return db.select().from(users).where(isNull(users.deletedAt)).all()
  },

  getById(db: BunSQLiteDatabase, id: string): UserRow | null {
    return db.select().from(users).where(and(eq(users.id, id), isNull(users.deletedAt))).get() ?? null
  },

  /** 根据账号（用户名/手机号/邮箱）查找用户，用于登录验证 */
  getByAccount(db: BunSQLiteDatabase, account: string): UserRow | null {
    return db.select().from(users).where(
      and(
        or(
          eq(users.username, account),
          eq(users.phone, account),
          eq(users.email, account),
        ),
        isNull(users.deletedAt),
      ),
    ).get() ?? null
  },

  async create(
    db: BunSQLiteDatabase,
    data: CreateUserType,
    deviceInfo?: DeviceInfo,
  ): Promise<UserRow> {
    const hashedPassword = await Bun.password.hash(data.password)
    const now = new Date()
    return db.insert(users).values({
      ...data,
      password: hashedPassword,
      ...deviceInfo,
      lastLoginAt: now,
    }).returning().get()!
  },

  async update(db: BunSQLiteDatabase, id: string, data: UpdateUserType): Promise<UserRow | null> {
    const { password, ...rest } = data
    const values = password
      ? { ...rest, password: await Bun.password.hash(password) }
      : rest
    return db.update(users).set(values).where(and(eq(users.id, id), isNull(users.deletedAt))).returning().get() ?? null
  },

  /** 更新用户登录信息 */
  updateLoginInfo(db: BunSQLiteDatabase, id: string, deviceInfo: DeviceInfo, ip: string): UserRow | null {
    return db.update(users).set({
      lastLoginAt: new Date(),
      lastLoginIp: ip,
      ...deviceInfo,
    }).where(and(eq(users.id, id), isNull(users.deletedAt))).returning().get() ?? null
  },

  /** 更新用户头像 */
  updateAvatar(db: BunSQLiteDatabase, id: string, avatar: string): UserRow | null {
    return db.update(users).set({ avatar }).where(and(eq(users.id, id), isNull(users.deletedAt))).returning().get() ?? null
  },

  remove(db: BunSQLiteDatabase, id: string): UserRow | null {
    return db.update(users).set({ deletedAt: new Date() }).where(and(eq(users.id, id), isNull(users.deletedAt))).returning().get() ?? null
  },
}
