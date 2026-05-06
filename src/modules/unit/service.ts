/**
 * 单位管理服务层
 *
 * 封装所有单位相关的数据库操作，供路由层调用。
 * 所有查询均通过 isNull(deletedAt) 过滤已软删除的记录。
 *
 * 核心算法：getTree() 将扁平数据转换为树形结构（双遍历法）
 */
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

  /** 获取所有未删除的单位（扁平列表） */
  getAll(): UnitRow[] {
    return this.db.select().from(units).where(isNull(units.deletedAt)).all()
  }

  /** 根据 ID 获取单个单位，不存在返回 null */
  getById(id: string): UnitRow | null {
    return this.db.select().from(units).where(and(eq(units.id, id), isNull(units.deletedAt))).get() ?? null
  }

  /** 创建单位，id 由 schema 层 nanoid 自动生成 */
  create(data: CreateUnitType): UnitRow {
    return this.db.insert(units).values(data).returning().get()!
  }

  /** 更新单位信息，不存在或已删除返回 null */
  update(id: string, data: UpdateUnitType): UnitRow | null {
    return this.db.update(units).set(data).where(and(eq(units.id, id), isNull(units.deletedAt))).returning().get() ?? null
  }

  /**
   * 软删除：将 deletedAt 设为当前时间戳，而非物理删除记录
   * 软删除后该单位不会出现在任何查询结果中
   */
  remove(id: string): UnitRow | null {
    return this.db.update(units).set({ deletedAt: new Date() }).where(and(eq(units.id, id), isNull(units.deletedAt))).returning().get() ?? null
  }

  /**
   * 构建单位树形结构（双遍历法，时间复杂度 O(n)）
   *
   * 算法步骤：
   * 1. 第一次遍历：将所有单位放入 Map<id, treeNode>，每个节点初始化空 children 数组
   * 2. 第二次遍历：根据 parentId 将子节点挂载到父节点的 children 中
   *    - 有 parentId 且父节点存在 → 挂到父节点下
   *    - 无 parentId 或父节点不存在 → 作为根节点
   *
   * 适用于parentId不会形成环的树结构数据
   */
  getTree(): UnitTreeNode[] {
    const all = this.getAll()
    const map = new Map<string, UnitTreeNode>()
    const roots: UnitTreeNode[] = []

    // 第一遍：建立 id → treeNode 的映射
    for (const unit of all) {
      map.set(unit.id, { ...unit, children: [] })
    }

    // 第二遍：根据 parentId 建立父子关系
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
