import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'

/**
 * 创建内存测试数据库，自动执行迁移
 * - 使用 :memory: SQLite，测试间完全隔离
 * - 通过 migrate() 执行 drizzle 迁移文件，schema 始终与定义同步
 */
export function createTestDb(): BunSQLiteDatabase {
  const sqlite = new Database(':memory:')
  const db = drizzle(sqlite)
  migrate(db, { migrationsFolder: './drizzle' })
  return db
}
