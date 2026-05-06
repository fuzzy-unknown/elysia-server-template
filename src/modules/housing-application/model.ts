import { t } from 'elysia'

/** 申请状态枚举 */
export const ApplicationStatusEnum = t.UnionEnum(['pending', 'approved', 'rejected', 'cancelled', 'completed'])

/** 住房申请完整信息 */
export const HousingApplication = t.Object({
  id: t.String({ description: '申请 ID' }),
  applicantId: t.String({ description: '申请人 ID' }),
  reason: t.String({ description: '申请原因' }),
  checkInDate: t.Date({ description: '入住时间' }),
  checkOutDate: t.Date({ description: '离开时间' }),
  roomId: t.Union([t.String(), t.Null()], { description: '分配的房间 ID，null 表示未分配' }),
  status: t.UnionEnum(['pending', 'approved', 'rejected', 'cancelled', 'completed']),
  remark: t.Union([t.String(), t.Null()], { description: '备注' }),
  createdAt: t.Date({ description: '创建时间' }),
  updatedAt: t.Date({ description: '更新时间' }),
  deletedAt: t.Union([t.Date(), t.Null()], { description: '删除时间' }),
})

/** 创建住房申请请求体 */
export const CreateHousingApplication = t.Object({
  reason: t.String({ minLength: 1, maxLength: 500, description: '申请原因' }),
  checkInDate: t.Date({ description: '入住时间' }),
  checkOutDate: t.Date({ description: '离开时间' }),
})

/** 更新住房申请请求体（仅备注） */
export const UpdateHousingApplication = t.Object({
  remark: t.Optional(t.String({ maxLength: 500, description: '备注' })),
})

/** 分配房间请求体 */
export const AssignRoomRequest = t.Object({
  roomId: t.String({ description: '房间 ID' }),
})

/** 错误响应 */
export const HousingApplicationError = t.Object({
  message: t.String({ description: '错误信息' }),
})

export type HousingApplicationType = typeof HousingApplication.static
export type CreateHousingApplicationType = typeof CreateHousingApplication.static
export type UpdateHousingApplicationType = typeof UpdateHousingApplication.static
export type AssignRoomRequestType = typeof AssignRoomRequest.static
