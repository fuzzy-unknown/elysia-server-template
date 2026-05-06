/**
 * 房间管理路由层
 *
 * 路由设计：
 * - GET    /rooms        获取所有房间列表
 * - GET    /rooms/:id    获取单个房间详情
 * - POST   /rooms        创建房间（需认证 isSignIn）
 * - PUT    /rooms/:id    更新房间（需认证 isSignIn）
 * - DELETE /rooms/:id    软删除房间（需认证 isSignIn）
 */
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth'
import { CreateRoom, Room, RoomError, UpdateRoom } from './model'
import { RoomService } from './service'

export function createRoomRouter(database: BunSQLiteDatabase) {
  const roomService = new RoomService(database)

  return new Elysia({ prefix: '/rooms' })
    .use(authPlugin)
    .decorate({ roomService })
    .model({
      'room': Room,
      'room.create': CreateRoom,
      'room.update': UpdateRoom,
      'room.error': RoomError,
    })
    // ==================== 查询 ====================
    .get('/', ({ roomService }) => roomService.getAll(), {
      detail: {
        summary: '获取所有房间列表',
        description: '返回所有未删除的房间列表',
        tags: ['房间管理'],
      },
      response: { 200: t.Array(Room) },
    })
    .get('/:id', ({ roomService, params: { id }, status }) => {
      const room = roomService.getById(id)
      if (!room)
        return status(404, { message: '房间不存在' })
      return room
    }, {
      detail: {
        summary: '根据 ID 获取房间详情',
        description: '通过房间 ID 查询房间的详细信息',
        tags: ['房间管理'],
      },
      params: t.Object({ id: t.String({ description: '房间 ID' }) }),
      response: { 200: Room, 404: RoomError },
    })
    // ==================== 写操作（需认证） ====================
    .post('/', ({ roomService, body, status }) => {
      return status(201, roomService.create(body))
    }, {
      isSignIn: true,
      detail: {
        summary: '创建房间',
        description: '创建新房间。需指定房间号和房间类型（single/double/luxury），状态默认空闲。',
        tags: ['房间管理'],
      },
      body: CreateRoom,
      response: { 201: Room },
    })
    .put('/:id', ({ roomService, params: { id }, body, status }) => {
      const room = roomService.update(id, body)
      if (!room)
        return status(404, { message: '房间不存在' })
      return room
    }, {
      isSignIn: true,
      detail: {
        summary: '更新房间信息',
        description: '更新指定房间信息。支持修改房间号、房间类型和状态。所有字段均为可选。',
        tags: ['房间管理'],
      },
      params: t.Object({ id: t.String({ description: '房间 ID' }) }),
      body: UpdateRoom,
      response: { 200: Room, 404: RoomError },
    })
    .delete('/:id', ({ roomService, params: { id }, status }) => {
      const room = roomService.remove(id)
      if (!room)
        return status(404, { message: '房间不存在' })
      return room
    }, {
      isSignIn: true,
      detail: {
        summary: '删除房间（软删除）',
        description: '软删除指定房间，设置 deletedAt 时间戳。删除后该房间不会出现在列表中。',
        tags: ['房间管理'],
      },
      params: t.Object({ id: t.String({ description: '房间 ID' }) }),
      response: { 200: Room, 404: RoomError },
    })
}
