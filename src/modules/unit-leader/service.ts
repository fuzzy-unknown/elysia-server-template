/**
 * 单位负责人服务层
 *
 * 管理单位与用户之间的负责人关系（多对多中间表）。
 * 按 sort 字段升序排列，sort 越小地位越高。
 */
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import type { CreateUnitLeaderType, UpdateUnitLeaderType } from './model'
import { and, asc, eq, isNull } from 'drizzle-orm'
import { unitLeaders } from '../../db/schema'

type UnitLeaderRow = typeof unitLeaders.$inferSelect

export class UnitLeaderService {
  constructor(private db: BunSQLiteDatabase) {}

  /** 获取某单位的所有负责人，按 sort 升序（地位高的在前） */
  getByUnitId(unitId: string): UnitLeaderRow[] {
    return this.db.select().from(unitLeaders).where(and(eq(unitLeaders.unitId, unitId), isNull(unitLeaders.deletedAt))).orderBy(asc(unitLeaders.sort)).all()
  }

  /** 根据 ID 获取单条负责人记录 */
  getById(id: string): UnitLeaderRow | null {
    return this.db.select().from(unitLeaders).where(and(eq(unitLeaders.id, id), isNull(unitLeaders.deletedAt))).get() ?? null
  }

  /** 添加负责人 */
  create(data: CreateUnitLeaderType): UnitLeaderRow {
    return this.db.insert(unitLeaders).values(data).returning().get()!
  }

  /** 更新负责人排序等信息 */
  update(id: string, data: UpdateUnitLeaderType): UnitLeaderRow | null {
    return this.db.update(unitLeaders).set(data).where(and(eq(unitLeaders.id, id), isNull(unitLeaders.deletedAt))).returning().get() ?? null
  }

  /** 软删除负责人记录 */
  remove(id: string): UnitLeaderRow | null {
    return this.db.update(unitLeaders).set({ deletedAt: new Date() }).where(and(eq(unitLeaders.id, id), isNull(unitLeaders.deletedAt))).returning().get() ?? null
  }
}
