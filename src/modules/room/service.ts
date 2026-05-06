/**
 * 房间管理服务层
 *
 * 封装房间相关的数据库操作，所有查询均过滤已软删除的记录。
 */
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import type { CreateRoomType, UpdateRoomType } from './model'
import { and, eq, isNull } from 'drizzle-orm'
import { rooms } from '../../db/schema'

type RoomRow = typeof rooms.$inferSelect

export class RoomService {
  constructor(private db: BunSQLiteDatabase) {}

  /** 获取所有未删除的房间 */
  getAll(): RoomRow[] {
    return this.db.select().from(rooms).where(isNull(rooms.deletedAt)).all()
  }

  /** 根据 ID 获取单个房间，不存在返回 null */
  getById(id: string): RoomRow | null {
    return this.db.select().from(rooms).where(and(eq(rooms.id, id), isNull(rooms.deletedAt))).get() ?? null
  }

  /** 创建房间 */
  create(data: CreateRoomType): RoomRow {
    return this.db.insert(rooms).values(data).returning().get()!
  }

  /** 更新房间信息，不存在或已删除返回 null */
  update(id: string, data: UpdateRoomType): RoomRow | null {
    return this.db.update(rooms).set(data).where(and(eq(rooms.id, id), isNull(rooms.deletedAt))).returning().get() ?? null
  }

  /** 软删除房间，设置 deletedAt 时间戳 */
  remove(id: string): RoomRow | null {
    return this.db.update(rooms).set({ deletedAt: new Date() }).where(and(eq(rooms.id, id), isNull(rooms.deletedAt))).returning().get() ?? null
  }
}
