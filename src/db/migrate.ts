import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

const sqlite = new Database("./.voasx/sqlite.db");
const db = drizzle(sqlite);

// 从 ./drizzle 目录读取迁移文件并执行
migrate(db, { migrationsFolder: "./.voasx/drizzle" });

console.log("Migration complete.");
