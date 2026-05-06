/**
 * 审批记录路由层
 *
 * 路由设计：
 * - GET    /pending        获取当前用户待审批的记录（需认证，根据用户担任负责人的单位自动过滤）
 * - GET    /:id            获取审批记录详情（需认证）
 * - PUT    /:id/approve    通过审批（需认证，仅目标单位负责人可操作）
 * - PUT    /:id/reject     驳回审批（需认证，仅目标单位负责人可操作）
 */
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth'
import { ApprovalAction, ApprovalRecord, ApprovalRecordError } from './model'
import { ApprovalRecordService } from './service'

export function createApprovalRecordRouter(database: BunSQLiteDatabase) {
  const approvalRecordService = new ApprovalRecordService(database)

  return new Elysia({ prefix: '/approval-records' })
    .use(authPlugin)
    .decorate({ approvalRecordService })
    .model({
      'approvalRecord': ApprovalRecord,
      'approvalRecord.action': ApprovalAction,
      'approvalRecord.error': ApprovalRecordError,
    })
    // ==================== 待审批列表 ====================
    .get('/pending', ({ approvalRecordService, userId }) => {
      return approvalRecordService.getPendingForUser(userId)
    }, {
      isSignIn: true,
      detail: {
        summary: '获取待审批记录',
        description: '根据当前用户担任负责人的单位，返回需要该用户审批的记录列表',
        tags: ['审批记录'],
      },
      response: { 200: t.Array(ApprovalRecord) },
    })
    // ==================== 审批记录详情 ====================
    .get('/:id', ({ approvalRecordService, params: { id }, status }) => {
      const record = approvalRecordService.getById(id)
      if (!record)
        return status(404, { message: '审批记录不存在' })
      return record
    }, {
      isSignIn: true,
      detail: {
        summary: '获取审批记录详情',
        description: '通过记录 ID 查询单条审批信息',
        tags: ['审批记录'],
      },
      params: t.Object({ id: t.String({ description: '记录 ID' }) }),
      response: { 200: ApprovalRecord, 404: ApprovalRecordError },
    })
    // ==================== 通过审批 ====================
    .put('/:id/approve', ({ approvalRecordService, params: { id }, userId, body, status }) => {
      const record = approvalRecordService.approve(id, userId, body)
      if (!record)
        return status(403, { message: '无权审批该记录（您不是目标单位的负责人）' })
      return record
    }, {
      isSignIn: true,
      detail: {
        summary: '通过审批',
        description: '审批通过申请。仅目标单位的负责人可操作。',
        tags: ['审批记录'],
      },
      params: t.Object({ id: t.String({ description: '记录 ID' }) }),
      body: ApprovalAction,
      response: { 200: ApprovalRecord, 403: ApprovalRecordError },
    })
    // ==================== 驳回审批 ====================
    .put('/:id/reject', ({ approvalRecordService, params: { id }, userId, body, status }) => {
      const record = approvalRecordService.reject(id, userId, body)
      if (!record)
        return status(403, { message: '无权审批该记录（您不是目标单位的负责人）' })
      return record
    }, {
      isSignIn: true,
      detail: {
        summary: '驳回审批',
        description: '驳回申请。仅目标单位的负责人可操作。',
        tags: ['审批记录'],
      },
      params: t.Object({ id: t.String({ description: '记录 ID' }) }),
      body: ApprovalAction,
      response: { 200: ApprovalRecord, 403: ApprovalRecordError },
    })
}
