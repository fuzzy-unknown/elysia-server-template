/**
 * 单位管理路由层
 *
 * 路由设计：
 * - GET    /units        获取所有单位（扁平列表）
 * - GET    /units/tree   获取单位树形结构
 * - GET    /units/:id    获取单个单位详情
 * - POST   /units        创建单位（需认证 isSignIn）
 * - PUT    /units/:id    更新单位（需认证 isSignIn）
 * - DELETE /units/:id    软删除单位（需认证 isSignIn）
 *
 * 工厂函数模式：createUnitRouter(db)
 * - 接收 drizzle 数据库实例，实例化 UnitService，将路由与 service 解耦
 * - 通过 .decorate() 将 service 注入到路由上下文，避免手动传参
 * - 通过 .model() 注册 TypeScript 类型 schema，启用请求/响应的运行时校验
 */
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { Elysia, t } from 'elysia'
import { CreateUnit, Unit, UnitError, UpdateUnit } from './model'
import { UnitService } from './service'

export function createUnitRouter(database: BunSQLiteDatabase) {
  const unitService = new UnitService(database)

  return new Elysia({ prefix: '/units' })
    .decorate({ unitService })
    .model({
      'unit': Unit,
      'unit.create': CreateUnit,
      'unit.update': UpdateUnit,
      'unit.error': UnitError,
    })
    // ==================== 查询 ====================
    .get('/', ({ unitService }) => unitService.getAll(), {
      detail: {
        summary: '获取所有单位列表',
        description: '返回所有未删除的单位扁平列表，不包含层级关系',
        tags: ['单位管理'],
      },
      response: { 200: t.Array(Unit) },
    })
    .get('/tree', ({ unitService }) => unitService.getTree(), {
      detail: {
        summary: '获取单位树形结构',
        description: '返回完整的单位树结构，每个节点包含 children 子单位数组。顶级单位（无父级）作为根节点。',
        tags: ['单位管理'],
      },
    })
    .get('/:id', ({ unitService, params: { id }, status }) => {
      const unit = unitService.getById(id)
      if (!unit)
        return status(404, { message: '单位不存在' })
      return unit
    }, {
      detail: {
        summary: '根据 ID 获取单位详情',
        description: '通过单位 ID 查询单位的详细信息',
        tags: ['单位管理'],
      },
      params: t.Object({ id: t.String({ description: '单位 ID' }) }),
      response: { 200: Unit, 404: UnitError },
    })
    // ==================== 写操作（需认证） ====================
    .post('/', ({ unitService, body, status }) => {
      return status(201, unitService.create(body))
    }, {
      isSignIn: true,
      detail: {
        summary: '创建单位',
        description: '创建新单位。可指定 parentId 将其挂载到某个父级单位下，不指定则为顶级单位。',
        tags: ['单位管理'],
      },
      body: CreateUnit,
      response: { 201: Unit },
    })
    .put('/:id', ({ unitService, params: { id }, body, status }) => {
      const unit = unitService.update(id, body)
      if (!unit)
        return status(404, { message: '单位不存在' })
      return unit
    }, {
      isSignIn: true,
      detail: {
        summary: '更新单位信息',
        description: '更新指定单位的信息。支持修改名称、简称、父级单位、状态和备注。所有字段均为可选，只传需要修改的字段。',
        tags: ['单位管理'],
      },
      params: t.Object({ id: t.String({ description: '单位 ID' }) }),
      body: UpdateUnit,
      response: { 200: Unit, 404: UnitError },
    })
    .delete('/:id', ({ unitService, params: { id }, status }) => {
      const unit = unitService.remove(id)
      if (!unit)
        return status(404, { message: '单位不存在' })
      return unit
    }, {
      isSignIn: true,
      detail: {
        summary: '删除单位（软删除）',
        description: '软删除指定单位，设置 deletedAt 时间戳。删除后该单位不会出现在列表和树结构中。',
        tags: ['单位管理'],
      },
      params: t.Object({ id: t.String({ description: '单位 ID' }) }),
      response: { 200: Unit, 404: UnitError },
    })
}
