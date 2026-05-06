/**
 * 数据库迁移脚本
 *
 * 执行方式：bun run db:migrate（或 bun run db 一键生成+迁移）
 *
 * 工作流程：
 * 1. drizzle-kit generate 根据 src/db/schema.ts 生成 SQL 迁移文件到 ./drizzle 目录
 * 2. 本脚本读取 ./drizzle 目录下的迁移文件，按顺序执行 SQL 语句
 * 3. 已执行过的迁移不会重复执行（drizzle 会在数据库中记录迁移状态）
 */
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'

const sqlite = new Database('./sqlite.db')
const db = drizzle(sqlite)

migrate(db, { migrationsFolder: './drizzle' })

console.log('Migration complete.')
