import { t } from 'elysia'

/** 审批状态枚举 */
export const ApprovalStatusEnum = t.UnionEnum(['pending', 'approved', 'rejected'])

/** 审批记录完整信息 */
export const ApprovalRecord = t.Object({
  id: t.String({ description: '审批记录 ID' }),
  applicationId: t.String({ description: '关联的申请 ID' }),
  step: t.Number({ description: '审批步骤（1=直属单位，2=上级单位）' }),
  targetUnitId: t.String({ description: '目标审批单位 ID' }),
  approverId: t.Union([t.String(), t.Null()], { description: '实际审批人 ID' }),
  status: ApprovalStatusEnum,
  comment: t.Union([t.String(), t.Null()], { description: '审批意见' }),
  approvedAt: t.Union([t.Date(), t.Null()], { description: '审批时间' }),
  createdAt: t.Date({ description: '创建时间' }),
  updatedAt: t.Date({ description: '更新时间' }),
  deletedAt: t.Union([t.Date(), t.Null()], { description: '删除时间' }),
})

/** 审批操作请求体 */
export const ApprovalAction = t.Object({
  comment: t.Optional(t.String({ maxLength: 500, description: '审批意见' })),
})

/** 错误响应 */
export const ApprovalRecordError = t.Object({
  message: t.String({ description: '错误信息' }),
})

export type ApprovalRecordType = typeof ApprovalRecord.static
export type ApprovalActionType = typeof ApprovalAction.static
