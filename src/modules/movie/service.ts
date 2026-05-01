import { eq } from 'drizzle-orm'
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { movies } from '../../db/schema'
import type { CreateMovieType, UpdateMovieType } from './model'

/**
 * 电影服务层
 * 通过构造函数注入数据库实例，便于测试时替换为内存数据库
 */
export class MovieService {
  constructor(private db: BunSQLiteDatabase) {}

  getAll() {
    return this.db.select().from(movies).all()
  }

  getById(id: number) {
    return this.db.select().from(movies).where(eq(movies.id, id)).get() ?? null
  }

  create(data: CreateMovieType) {
    return this.db.insert(movies).values(data).returning().get()
  }

  update(id: number, data: UpdateMovieType) {
    return this.db.update(movies).set(data).where(eq(movies.id, id)).returning().get() ?? null
  }

  remove(id: number) {
    return this.db.delete(movies).where(eq(movies.id, id)).returning().get() ?? null
  }
}
