/**
 * 用户管理服务层
 *
 * 封装用户相关的数据库操作，包括密码哈希处理。
 * 所有查询均通过 isNull(deletedAt) 过滤已软删除的记录。
 *
 * 密码安全策略：
 * - 使用 Bun.password.hash() 进行哈希（基于 bcrypt）
 * - 使用 Bun.password.verify() 验证密码
 * - 数据库中只存储哈希值，原始密码不会被持久化
 */
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import type { CreateUserType, UpdateUserType } from './model'
import { and, eq, isNull } from 'drizzle-orm'
import { users } from '../../db/schema'

type UserRow = typeof users.$inferSelect

export class UserService {
  constructor(private db: BunSQLiteDatabase) {}

  /** 获取所有未删除的用户 */
  getAll(): UserRow[] {
    return this.db.select().from(users).where(isNull(users.deletedAt)).all()
  }

  /** 根据 ID 获取单个用户，不存在返回 null */
  getById(id: string): UserRow | null {
    return this.db.select().from(users).where(and(eq(users.id, id), isNull(users.deletedAt))).get() ?? null
  }

  /** 根据用户名查找用户，用于登录验证 */
  getByUsername(username: string): UserRow | null {
    return this.db.select().from(users).where(and(eq(users.username, username), isNull(users.deletedAt))).get() ?? null
  }

  /**
   * 创建用户，自动对密码进行哈希处理
   * Bun.password.hash 默认使用 bcrypt 算法，cost factor 为 10
   */
  async create(data: CreateUserType): Promise<UserRow> {
    const hashedPassword = await Bun.password.hash(data.password)
    return this.db.insert(users).values({
      ...data,
      password: hashedPassword,
    }).returning().get()!
  }

  /**
   * 更新用户信息
   * 如果请求中包含 password 字段，则自动重新哈希后再更新
   * 如果不包含 password，则只更新其他字段
   */
  async update(id: string, data: UpdateUserType): Promise<UserRow | null> {
    const { password, ...rest } = data
    const values = password
      ? { ...rest, password: await Bun.password.hash(password) }
      : rest
    return this.db.update(users).set(values).where(and(eq(users.id, id), isNull(users.deletedAt))).returning().get() ?? null
  }

  /** 软删除用户，设置 deletedAt 时间戳 */
  remove(id: string): UserRow | null {
    return this.db.update(users).set({ deletedAt: new Date() }).where(and(eq(users.id, id), isNull(users.deletedAt))).returning().get() ?? null
  }
}
