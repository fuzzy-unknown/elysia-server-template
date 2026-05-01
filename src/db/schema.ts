import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * 电影表
 * - title 对应数据库列名 name
 * - releaseYear 对应数据库列名 release_year
 */
export const movies = sqliteTable("movies", {
  id: integer("id").primaryKey(),
  title: text("name").notNull(),
  releaseYear: integer("release_year").notNull(),
});
