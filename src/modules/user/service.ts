import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import type { CreateUserType, UpdateUserType } from './model'
import { and, eq, isNull } from 'drizzle-orm'
import { users } from '../../db/schema'

type UserRow = typeof users.$inferSelect

export class UserService {
  constructor(private db: BunSQLiteDatabase) {}

  getAll(): UserRow[] {
    return this.db.select().from(users).where(isNull(users.deletedAt)).all()
  }

  getById(id: string): UserRow | null {
    return this.db.select().from(users).where(and(eq(users.id, id), isNull(users.deletedAt))).get() ?? null
  }

  getByUsername(username: string): UserRow | null {
    return this.db.select().from(users).where(and(eq(users.username, username), isNull(users.deletedAt))).get() ?? null
  }

  async create(data: CreateUserType): Promise<UserRow> {
    const hashedPassword = await Bun.password.hash(data.password)
    return this.db.insert(users).values({
      ...data,
      password: hashedPassword,
    }).returning().get()!
  }

  async update(id: string, data: UpdateUserType): Promise<UserRow | null> {
    const { password, ...rest } = data
    const values = password
      ? { ...rest, password: await Bun.password.hash(password) }
      : rest
    return this.db.update(users).set(values).where(and(eq(users.id, id), isNull(users.deletedAt))).returning().get() ?? null
  }

  remove(id: string): UserRow | null {
    return this.db.update(users).set({ deletedAt: new Date() }).where(and(eq(users.id, id), isNull(users.deletedAt))).returning().get() ?? null
  }
}
