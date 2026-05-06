/**
 * 审批记录服务层
 *
 * 处理审批记录的查询、通过、驳回操作。
 * 核心逻辑：
 * - 用户只能看到自己担任负责人的单位相关的待审批记录
 * - 审批时检查用户是否为目标单位的负责人
 * - 步骤 1 通过后自动进入步骤 2，步骤 2 通过后申请状态变为 approved
 */
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import type { ApprovalActionType } from './model'
import { and, asc, eq, inArray, isNull } from 'drizzle-orm'
import { approvalRecords, housingApplications, unitLeaders } from '../../db/schema'

type ApprovalRecordRow = typeof approvalRecords.$inferSelect
type ApplicationRow = typeof housingApplications.$inferSelect

interface ApprovalRecordWithApp extends ApprovalRecordRow {
  application: ApplicationRow
}

export class ApprovalRecordService {
  constructor(private db: BunSQLiteDatabase) {}

  /**
   * 获取当前用户待审批的记录
   * 逻辑：查询用户担任负责人的所有单位，查找这些单位的 pending 状态审批记录
   */
  getPendingForUser(userId: string): ApprovalRecordWithApp[] {
    // 1. 查询用户担任负责人的所有单位 ID
    const leaderUnits = this.db.select().from(unitLeaders).where(and(eq(unitLeaders.userId, userId), isNull(unitLeaders.deletedAt))).all()

    if (leaderUnits.length === 0)
      return []

    const unitIds = leaderUnits.map(u => u.unitId)

    // 2. 查询这些单位的待审批记录
    const records = this.db.select().from(approvalRecords).where(and(
      eq(approvalRecords.status, 'pending'),
      inArray(approvalRecords.targetUnitId, unitIds),
      isNull(approvalRecords.deletedAt),
    )).orderBy(asc(approvalRecords.step)).all()

    // 3. 关联申请信息
    return records.map((record) => {
      const app = this.db.select().from(housingApplications).where(eq(housingApplications.id, record.applicationId)).get()!
      return { ...record, application: app }
    })
  }

  /** 根据 ID 获取审批记录 */
  getById(id: string): ApprovalRecordRow | null {
    return this.db.select().from(approvalRecords).where(and(eq(approvalRecords.id, id), isNull(approvalRecords.deletedAt))).get() ?? null
  }

  /**
   * 通过审批
   * 1. 检查用户是否为目标单位负责人
   * 2. 更新审批记录状态为 approved
   * 3. 检查同申请的其他步骤是否全部通过，是则更新申请状态为 approved
   */
  approve(id: string, userId: string, action: ApprovalActionType): ApprovalRecordRow | null {
    const record = this.getById(id)
    if (!record)
      return null

    // 检查用户是否为目标单位负责人
    const isLeader = this.db.select().from(unitLeaders).where(and(
      eq(unitLeaders.unitId, record.targetUnitId),
      eq(unitLeaders.userId, userId),
      isNull(unitLeaders.deletedAt),
    )).get()

    if (!isLeader)
      return null

    // 更新审批记录
    const updated = this.db.update(approvalRecords)
      .set({
        status: 'approved',
        approverId: userId,
        comment: action.comment ?? null,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(approvalRecords.id, id), isNull(approvalRecords.deletedAt)))
      .returning()
      .get() ?? null

    if (!updated)
      return null

    // 检查该申请的所有审批步骤是否都通过了
    this.checkAndUpdateApplicationStatus(record.applicationId)

    return updated
  }

  /**
   * 驳回审批
   * 1. 检查用户是否为目标单位负责人
   * 2. 更新审批记录状态为 rejected
   * 3. 更新申请状态为 rejected
   */
  reject(id: string, userId: string, action: ApprovalActionType): ApprovalRecordRow | null {
    const record = this.getById(id)
    if (!record)
      return null

    // 检查用户是否为目标单位负责人
    const isLeader = this.db.select().from(unitLeaders).where(and(
      eq(unitLeaders.unitId, record.targetUnitId),
      eq(unitLeaders.userId, userId),
      isNull(unitLeaders.deletedAt),
    )).get()

    if (!isLeader)
      return null

    // 更新审批记录
    const updated = this.db.update(approvalRecords)
      .set({
        status: 'rejected',
        approverId: userId,
        comment: action.comment ?? null,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(approvalRecords.id, id), isNull(approvalRecords.deletedAt)))
      .returning()
      .get() ?? null

    if (!updated)
      return null

    // 更新申请状态为 rejected
    this.db.update(housingApplications)
      .set({ status: 'rejected', updatedAt: new Date() })
      .where(eq(housingApplications.id, record.applicationId))
      .run()

    return updated
  }

  /** 检查申请的所有审批步骤状态，决定是否更新申请状态 */
  private checkAndUpdateApplicationStatus(applicationId: string) {
    const allRecords = this.db.select().from(approvalRecords).where(and(eq(approvalRecords.applicationId, applicationId), isNull(approvalRecords.deletedAt))).all()

    // 如果有任何一个被 reject，申请已经是 rejected（在 reject 时已处理）
    const hasRejected = allRecords.some(r => r.status === 'rejected')
    if (hasRejected)
      return

    // 如果所有步骤都 approved，更新申请状态为 approved
    const allApproved = allRecords.every(r => r.status === 'approved')
    if (allApproved) {
      this.db.update(housingApplications)
        .set({ status: 'approved', updatedAt: new Date() })
        .where(eq(housingApplications.id, applicationId))
        .run()
    }
  }
}

export type { ApprovalRecordWithApp }
