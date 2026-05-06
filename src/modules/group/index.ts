/**
 * 组管理路由层
 *
 * 路由设计：
 * 组 CRUD:
 * - GET    /groups           获取所有组
 * - GET    /groups/:id       获取组详情
 * - GET    /groups/:id/members  获取组成员列表
 * - POST   /groups           创建组（需认证）
 * - PUT    /groups/:id       更新组（需认证）
 * - DELETE /groups/:id       删除组（需认证）
 *
 * 组成员管理：
 * - GET    /groups/my        获取我加入的组（需认证）
 * - POST   /groups/:id/members    添加成员（需认证）
 * - PUT    /groups/:id/members/:userId  更新成员角色（需认证）
 * - DELETE /groups/:id/members/:userId  移除成员（需认证）
 */
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { Elysia, t } from 'elysia'
import { authPlugin } from '../../plugins/auth'
import { AddMemberRequest, CreateGroup, Group, GroupError, UpdateGroup, UpdateMemberRequest } from './model'
import { GroupService } from './service'

export function createGroupRouter(database: BunSQLiteDatabase) {
  const groupService = new GroupService(database)

  return new Elysia({ prefix: '/groups' })
    .use(authPlugin)
    .decorate({ groupService })
    .model({
      'group': Group,
      'group.create': CreateGroup,
      'group.update': UpdateGroup,
      'group.addMember': AddMemberRequest,
      'group.updateMember': UpdateMemberRequest,
      'group.error': GroupError,
    })
    // ==================== 组查询 ====================
    .get('/', ({ groupService }) => groupService.getAll(), {
      detail: {
        summary: '获取所有组列表',
        description: '返回所有已创建的组（排除已删除）',
        tags: ['组管理'],
      },
      response: { 200: t.Array(Group) },
    })
    .get('/my', ({ groupService, userId }) => groupService.getUserGroups(userId), {
      isSignIn: true,
      detail: {
        summary: '获取我加入的组',
        description: '查询当前登录用户所属的所有组',
        tags: ['组管理'],
      },
      response: { 200: t.Array(Group) },
    })
    .get('/:id', ({ groupService, params: { id }, status }) => {
      const group = groupService.getById(id)
      if (!group)
        return status(404, { message: '组不存在' })
      return group
    }, {
      detail: {
        summary: '获取组详情',
        description: '通过组 ID 查询组的详细信息',
        tags: ['组管理'],
      },
      params: t.Object({ id: t.String({ description: '组 ID' }) }),
      response: { 200: Group, 404: GroupError },
    })
    .get('/:id/members', ({ groupService, params: { id } }) => {
      return groupService.getMembers(id)
    }, {
      isSignIn: true,
      detail: {
        summary: '获取组成员列表',
        description: '查询指定组的所有成员',
        tags: ['组管理'],
      },
      params: t.Object({ id: t.String({ description: '组 ID' }) }),
      response: { 200: t.Array(t.Any()) },
    })
    // ==================== 组写操作 ====================
    .post('/', ({ groupService, userId, body, status }) => {
      const group = groupService.create(userId, body)
      return status(201, group)
    }, {
      isSignIn: true,
      detail: {
        summary: '创建组',
        description: '创建新组，创建者自动成为组负责人',
        tags: ['组管理'],
      },
      body: CreateGroup,
      response: { 201: Group },
    })
    .put('/:id', ({ groupService, params: { id }, body, status }) => {
      const group = groupService.update(id, body)
      if (!group)
        return status(404, { message: '组不存在' })
      return group
    }, {
      isSignIn: true,
      detail: {
        summary: '更新组信息',
        description: '修改组的名称、描述或状态',
        tags: ['组管理'],
      },
      params: t.Object({ id: t.String({ description: '组 ID' }) }),
      body: UpdateGroup,
      response: { 200: Group, 404: GroupError },
    })
    .delete('/:id', ({ groupService, params: { id }, status }) => {
      const group = groupService.remove(id)
      if (!group)
        return status(404, { message: '组不存在' })
      return group
    }, {
      isSignIn: true,
      detail: {
        summary: '删除组（软删除）',
        description: '软删除组，组内成员关系也会被保留',
        tags: ['组管理'],
      },
      params: t.Object({ id: t.String({ description: '组 ID' }) }),
      response: { 200: Group, 404: GroupError },
    })
    // ==================== 组成员管理 ====================
    .post('/:id/members', ({ groupService, params: { id }, body, status }) => {
      try {
        const member = groupService.addMember(id, body.userId, body.role)
        return status(201, member)
      }
      catch {
        return status(400, { message: '添加失败（用户已在组中）' })
      }
    }, {
      isSignIn: true,
      detail: {
        summary: '添加组成员',
        description: '将指定用户添加到组中，可设置角色',
        tags: ['组管理'],
      },
      params: t.Object({ id: t.String({ description: '组 ID' }) }),
      body: AddMemberRequest,
      response: { 201: t.Any(), 400: GroupError },
    })
    .put('/:id/members/:userId', ({ groupService, params: { id, userId }, body, status }) => {
      const member = groupService.updateMemberRole(id, userId, body.role)
      if (!member)
        return status(404, { message: '成员记录不存在' })
      return member
    }, {
      isSignIn: true,
      detail: {
        summary: '更新成员角色',
        description: '修改用户在组中的角色/头衔',
        tags: ['组管理'],
      },
      params: t.Object({
        id: t.String({ description: '组 ID' }),
        userId: t.String({ description: '用户 ID' }),
      }),
      body: UpdateMemberRequest,
      response: { 200: t.Any(), 404: GroupError },
    })
    .delete('/:id/members/:userId', ({ groupService, params: { id, userId }, status }) => {
      const member = groupService.removeMember(id, userId)
      if (!member)
        return status(404, { message: '成员记录不存在' })
      return member
    }, {
      isSignIn: true,
      detail: {
        summary: '移除组成员',
        description: '从组中移除指定用户（软删除）',
        tags: ['组管理'],
      },
      params: t.Object({
        id: t.String({ description: '组 ID' }),
        userId: t.String({ description: '用户 ID' }),
      }),
      response: { 200: t.Any(), 404: GroupError },
    })
}
