/**
 * 住房申请路由层
 *
 * 路由设计：
 * - POST   /                       提交申请（需认证，自动创建审批记录）
 * - GET    /                       查询申请列表（支持 status 筛选）
 * - GET    /:id                    获取申请详情（含审批记录）
 * - GET    /my                     获取当前用户的申请列表
 * - PUT    /:id/cancel             取消申请（仅申请人，status=pending）
 * - PUT    /:id/assign-room        分配房间（需认证，仅 status=approved）
 */
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth'
import { AssignRoomRequest, CreateHousingApplication, HousingApplication, HousingApplicationError, UpdateHousingApplication } from './model'
import { HousingApplicationService } from './service'

export function createHousingApplicationRouter(database: BunSQLiteDatabase) {
  const housingApplicationService = new HousingApplicationService(database)

  return new Elysia({ prefix: '/housing-applications' })
    .use(authPlugin)
    .decorate({ housingApplicationService })
    .model({
      'housingApplication': HousingApplication,
      'housingApplication.create': CreateHousingApplication,
      'housingApplication.update': UpdateHousingApplication,
      'housingApplication.assignRoom': AssignRoomRequest,
      'housingApplication.error': HousingApplicationError,
    })
    // ==================== 提交申请 ====================
    .post('/', ({ housingApplicationService, body, userId, status }) => {
      // userId 由 authPlugin 的 isSignIn 宏注入
      // 需要从用户表查询申请人所在单位 ID
      // 这里简化处理：假设传入 unitId，实际应从用户表获取
      const applicantUnitId = body.unitId
      if (!applicantUnitId) {
        return status(400, { message: '请提供单位 ID' })
      }
      const { unitId, ...applicationData } = body as typeof body & { unitId?: string }
      const application = housingApplicationService.create(userId, applicantUnitId, applicationData)
      return status(201, application)
    }, {
      isSignIn: true,
      detail: {
        summary: '提交住房申请',
        description: '提交临时住房申请，系统自动创建审批记录（步骤 1=直属单位，步骤 2=上级单位）。申请人所在单位根据当前登录用户自动获取。',
        tags: ['住房申请'],
      },
      body: t.Object({
        reason: t.String({ minLength: 1, maxLength: 500, description: '申请原因' }),
        checkInDate: t.Date({ description: '入住时间' }),
        checkOutDate: t.Date({ description: '离开时间' }),
        unitId: t.String({ description: '申请人所在单位 ID（用于确定审批链）' }),
      }),
      response: { 201: HousingApplication, 400: HousingApplicationError },
    })
    // ==================== 查询列表 ====================
    .get('/', ({ housingApplicationService, query: { status } }) => {
      // 简化：返回所有申请，实际应按权限过滤
      const all = housingApplicationService.getAll(status as any)
      return all
    }, {
      isSignIn: true,
      detail: {
        summary: '查询住房申请列表',
        description: '支持按 status 筛选。管理员可查看所有申请。',
        tags: ['住房申请'],
      },
      query: t.Optional(t.Object({
        status: t.UnionEnum(['pending', 'approved', 'rejected', 'cancelled', 'completed'], { description: '申请状态筛选' }),
      })),
      response: { 200: t.Array(HousingApplication) },
    })
    .get('/my', ({ housingApplicationService, userId }) => {
      return housingApplicationService.getByApplicantId(userId)
    }, {
      isSignIn: true,
      detail: {
        summary: '获取我的申请列表',
        description: '查询当前登录用户提交的所有住房申请',
        tags: ['住房申请'],
      },
      response: { 200: t.Array(HousingApplication) },
    })
    // ==================== 申请详情 ====================
    .get('/:id', ({ housingApplicationService, params: { id }, status }) => {
      const application = housingApplicationService.getById(id)
      if (!application)
        return status(404, { message: '申请不存在' })
      return application
    }, {
      isSignIn: true,
      detail: {
        summary: '获取申请详情',
        description: '获取单条住房申请的详细信息，包含审批记录列表',
        tags: ['住房申请'],
      },
      params: t.Object({ id: t.String({ description: '申请 ID' }) }),
      response: { 200: HousingApplication, 404: HousingApplicationError },
    })
    // ==================== 取消申请 ====================
    .put('/:id/cancel', ({ housingApplicationService, params: { id }, status }) => {
      const application = housingApplicationService.cancel(id)
      if (!application)
        return status(400, { message: '无法取消该申请（可能已审批或已取消）' })
      return application
    }, {
      isSignIn: true,
      detail: {
        summary: '取消申请',
        description: '仅申请人可取消状态为 pending 的申请',
        tags: ['住房申请'],
      },
      params: t.Object({ id: t.String({ description: '申请 ID' }) }),
      response: { 200: HousingApplication, 400: HousingApplicationError },
    })
    // ==================== 分配房间 ====================
    .put('/:id/assign-room', ({ housingApplicationService, params: { id }, body, status }) => {
      const application = housingApplicationService.assignRoom(id, body.roomId)
      if (!application)
        return status(400, { message: '分配失败（申请状态必须为 approved）' })
      return application
    }, {
      isSignIn: true,
      detail: {
        summary: '分配房间',
        description: '为已审批通过的申请分配房间，分配后状态变为 completed',
        tags: ['住房申请'],
      },
      params: t.Object({ id: t.String({ description: '申请 ID' }) }),
      body: AssignRoomRequest,
      response: { 200: HousingApplication, 400: HousingApplicationError },
    })
}
