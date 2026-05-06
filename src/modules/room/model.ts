import { t } from 'elysia'

/** 房间类型枚举 */
export const RoomTypeEnum = t.UnionEnum(['single', 'double', 'luxury'])

/** 房间状态枚举 */
export const RoomStatusEnum = t.UnionEnum(['in_use', 'idle', 'maintenance'])

/** 房间完整信息 */
export const Room = t.Object({
  id: t.String({ description: '房间 ID' }),
  roomNumber: t.String({ description: '房间号' }),
  roomType: RoomTypeEnum,
  status: RoomStatusEnum,
  createdAt: t.Date({ description: '创建时间' }),
  updatedAt: t.Date({ description: '更新时间' }),
  deletedAt: t.Union([t.Date(), t.Null()], { description: '删除时间，null 表示未删除' }),
})

/** 创建房间请求体 */
export const CreateRoom = t.Object({
  roomNumber: t.String({ minLength: 1, maxLength: 50, description: '房间号，如 301、A-1201' }),
  roomType: RoomTypeEnum,
  status: t.Optional(RoomStatusEnum),
})

/** 更新房间请求体 */
export const UpdateRoom = t.Object({
  roomNumber: t.Optional(t.String({ minLength: 1, maxLength: 50, description: '房间号' })),
  roomType: t.Optional(RoomTypeEnum),
  status: t.Optional(RoomStatusEnum),
})

/** 错误响应 */
export const RoomError = t.Object({
  message: t.String({ description: '错误信息' }),
})

export type RoomType = typeof Room.static
export type CreateRoomType = typeof CreateRoom.static
export type UpdateRoomType = typeof UpdateRoom.static
