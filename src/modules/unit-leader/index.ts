/**
 * 单位负责人路由层
 *
 * 路由设计：
 * - GET    /unit-leaders?unitId=xxx  获取某单位的所有负责人（按 sort 升序）
 * - GET    /unit-leaders/:id         获取单条负责人记录
 * - POST   /unit-leaders             添加负责人（需认证）
 * - PUT    /unit-leaders/:id         更新负责人排序（需认证）
 * - DELETE /unit-leaders/:id         移除负责人（需认证）
 */
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth'
import { CreateUnitLeader, UnitLeader, UnitLeaderError, UpdateUnitLeader } from './model'
import { UnitLeaderService } from './service'

export function createUnitLeaderRouter(database: BunSQLiteDatabase) {
  const unitLeaderService = new UnitLeaderService(database)

  return new Elysia({ prefix: '/unit-leaders' })
    .use(authPlugin)
    .decorate({ unitLeaderService })
    .model({
      'unitLeader': UnitLeader,
      'unitLeader.create': CreateUnitLeader,
      'unitLeader.update': UpdateUnitLeader,
      'unitLeader.error': UnitLeaderError,
    })
    // ==================== 查询 ====================
    .get('/', ({ unitLeaderService, query: { unitId } }) => {
      return unitLeaderService.getByUnitId(unitId)
    }, {
      detail: {
        summary: '获取单位负责人列表',
        description: '根据 unitId 查询该单位的所有负责人，按 sort 升序排列（地位高的在前）',
        tags: ['负责人管理'],
      },
      query: t.Object({ unitId: t.String({ description: '单位 ID' }) }),
      response: { 200: t.Array(UnitLeader) },
    })
    .get('/:id', ({ unitLeaderService, params: { id }, status }) => {
      const leader = unitLeaderService.getById(id)
      if (!leader)
        return status(404, { message: '负责人记录不存在' })
      return leader
    }, {
      detail: {
        summary: '获取负责人记录详情',
        description: '通过记录 ID 查询单条负责人信息',
        tags: ['负责人管理'],
      },
      params: t.Object({ id: t.String({ description: '记录 ID' }) }),
      response: { 200: UnitLeader, 404: UnitLeaderError },
    })
    // ==================== 写操作（需认证） ====================
    .post('/', ({ unitLeaderService, body, status }) => {
      return status(201, unitLeaderService.create(body))
    }, {
      isSignIn: true,
      detail: {
        summary: '添加负责人',
        description: '为单位指定一个负责人用户。通过 sort 控制排序，数值越小地位越高。',
        tags: ['负责人管理'],
      },
      body: CreateUnitLeader,
      response: { 201: UnitLeader },
    })
    .put('/:id', ({ unitLeaderService, params: { id }, body, status }) => {
      const leader = unitLeaderService.update(id, body)
      if (!leader)
        return status(404, { message: '负责人记录不存在' })
      return leader
    }, {
      isSignIn: true,
      detail: {
        summary: '更新负责人排序',
        description: '更新负责人的 sort 值来调整其排序地位',
        tags: ['负责人管理'],
      },
      params: t.Object({ id: t.String({ description: '记录 ID' }) }),
      body: UpdateUnitLeader,
      response: { 200: UnitLeader, 404: UnitLeaderError },
    })
    .delete('/:id', ({ unitLeaderService, params: { id }, status }) => {
      const leader = unitLeaderService.remove(id)
      if (!leader)
        return status(404, { message: '负责人记录不存在' })
      return leader
    }, {
      isSignIn: true,
      detail: {
        summary: '移除负责人',
        description: '软删除负责人记录，移除该用户在指定单位的负责人身份',
        tags: ['负责人管理'],
      },
      params: t.Object({ id: t.String({ description: '记录 ID' }) }),
      response: { 200: UnitLeader, 404: UnitLeaderError },
    })
}
