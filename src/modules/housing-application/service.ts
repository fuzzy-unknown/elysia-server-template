/**
 * 住房申请服务层
 *
 * 处理住房申请的创建、查询、取消、分配房间等操作。
 * 创建申请时自动创建审批记录（步骤 1=直属单位，步骤 2=上级单位）。
 */
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import type { CreateHousingApplicationType, UpdateHousingApplicationType } from './model'
import { and, asc, eq, isNull } from 'drizzle-orm'
import { approvalRecords, housingApplications, units } from '../../db/schema'

type ApplicationRow = typeof housingApplications.$inferSelect
type ApprovalRecordRow = typeof approvalRecords.$inferSelect

interface ApplicationWithApprovals extends ApplicationRow {
  approvalRecords: ApprovalRecordRow[]
}

export class HousingApplicationService {
  constructor(private db: BunSQLiteDatabase) {}

  /** 创建申请，同时自动创建审批记录 */
  create(applicantId: string, applicantUnitId: string, data: CreateHousingApplicationType): ApplicationWithApprovals {
    // 1. 创建申请
    const application = this.db.insert(housingApplications).values({
      ...data,
      applicantId,
    }).returning().get()!

    // 2. 查询申请人所在单位的上级单位
    const applicantUnit = this.db.select().from(units).where(eq(units.id, applicantUnitId)).get()

    // 3. 创建步骤 1 审批记录（直属单位负责人审批）
    this.db.insert(approvalRecords).values({
      applicationId: application.id,
      step: 1,
      targetUnitId: applicantUnitId,
    }).returning().get()!

    // 4. 如果有上级单位，创建步骤 2 审批记录
    if (applicantUnit?.parentId) {
      this.db.insert(approvalRecords).values({
        applicationId: application.id,
        step: 2,
        targetUnitId: applicantUnit.parentId,
      }).returning().get()!
    }

    // 5. 返回申请及审批记录
    const approvals = this.db.select().from(approvalRecords).where(and(eq(approvalRecords.applicationId, application.id), isNull(approvalRecords.deletedAt))).orderBy(asc(approvalRecords.step)).all()

    return { ...application, approvalRecords: approvals }
  }

  /** 根据 ID 获取申请详情（含审批记录） */
  getById(id: string): ApplicationWithApprovals | null {
    const application = this.db.select().from(housingApplications).where(and(eq(housingApplications.id, id), isNull(housingApplications.deletedAt))).get()

    if (!application)
      return null

    const approvals = this.db.select().from(approvalRecords).where(and(eq(approvalRecords.applicationId, id), isNull(approvalRecords.deletedAt))).orderBy(asc(approvalRecords.step)).all()

    return { ...application, approvalRecords: approvals }
  }

  /** 获取申请人的所有申请 */
  getByApplicantId(applicantId: string): ApplicationRow[] {
    return this.db.select().from(housingApplications).where(and(eq(housingApplications.applicantId, applicantId), isNull(housingApplications.deletedAt))).all()
  }

  /** 获取所有申请（支持按状态筛选） */
  getAll(status?: string): ApplicationRow[] {
    const conditions = [isNull(housingApplications.deletedAt)]
    if (status) {
      conditions.push(eq(housingApplications.status, status))
    }
    return this.db.select().from(housingApplications).where(and(...conditions)).all()
  }

  /** 取消申请（仅申请人可操作，且状态必须为 pending） */
  cancel(id: string): ApplicationRow | null {
    const app = this.getById(id)
    if (!app || app.status !== 'pending')
      return null

    return this.db.update(housingApplications)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(eq(housingApplications.id, id), isNull(housingApplications.deletedAt)))
      .returning()
      .get() ?? null
  }

  /** 分配房间（仅 status=approved 可申请） */
  assignRoom(id: string, roomId: string): ApplicationRow | null {
    const app = this.getById(id)
    if (!app || app.status !== 'approved')
      return null

    return this.db.update(housingApplications)
      .set({ roomId, status: 'completed', updatedAt: new Date() })
      .where(and(eq(housingApplications.id, id), isNull(housingApplications.deletedAt)))
      .returning()
      .get() ?? null
  }

  /** 更新备注 */
  update(id: string, data: UpdateHousingApplicationType): ApplicationRow | null {
    return this.db.update(housingApplications)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(housingApplications.id, id), isNull(housingApplications.deletedAt)))
      .returning()
      .get() ?? null
  }
}

export type { ApplicationWithApprovals }
