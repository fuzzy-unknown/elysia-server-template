/**
 * 数据库连接配置
 *
 * 使用 Bun 原生 SQLite 驱动 + Drizzle ORM
 * - 数据库文件 sqlite.db 在项目根目录，首次运行时自动创建
 * - 通过 drizzle() 包装后获得类型安全的查询构建器
 * - 使用前需先执行 bun run db:migrate 创建表结构
 */
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'

const sqlite = new Database('./sqlite.db')
export const db = drizzle(sqlite)
