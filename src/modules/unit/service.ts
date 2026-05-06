import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import type { CreateUnitType, UpdateUnitType } from './model'
import { and, eq, isNull } from 'drizzle-orm'
import { units } from '../../db/schema'

type UnitRow = typeof units.$inferSelect

interface UnitTreeNode extends UnitRow {
  children: UnitTreeNode[]
}

export class UnitService {
  constructor(private db: BunSQLiteDatabase) {}

  getAll(): UnitRow[] {
    return this.db.select().from(units).where(isNull(units.deletedAt)).all()
  }

  getById(id: string): UnitRow | null {
    return this.db.select().from(units).where(and(eq(units.id, id), isNull(units.deletedAt))).get() ?? null
  }

  create(data: CreateUnitType): UnitRow {
    return this.db.insert(units).values(data).returning().get()!
  }

  update(id: string, data: UpdateUnitType): UnitRow | null {
    return this.db.update(units).set(data).where(and(eq(units.id, id), isNull(units.deletedAt))).returning().get() ?? null
  }

  remove(id: string): UnitRow | null {
    return this.db.update(units).set({ deletedAt: new Date() }).where(and(eq(units.id, id), isNull(units.deletedAt))).returning().get() ?? null
  }

  getTree(): UnitTreeNode[] {
    const all = this.getAll()
    const map = new Map<string, UnitTreeNode>()
    const roots: UnitTreeNode[] = []

    for (const unit of all) {
      map.set(unit.id, { ...unit, children: [] })
    }

    for (const unit of all) {
      const node = map.get(unit.id)!
      if (unit.parentId && map.has(unit.parentId)) {
        map.get(unit.parentId)!.children.push(node)
      }
      else {
        roots.push(node)
      }
    }

    return roots
  }
}

export type { UnitTreeNode as UnitTreeNodeType }
