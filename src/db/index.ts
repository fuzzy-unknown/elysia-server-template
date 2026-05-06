import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'

// SQLite 数据库文件，首次运行时自动创建
const sqlite = new Database('./sqlite.db')
export const db = drizzle(sqlite)
