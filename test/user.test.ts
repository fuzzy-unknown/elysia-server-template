import { treaty } from '@elysia/eden'
import { beforeEach, describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { createUserRouter } from '../src/modules/user'
import { createTestDb } from './setup'

/**
 * 创建测试用的 Elysia 应用和 Eden Treaty 客户端
 * - 使用内存 SQLite，通过 migrate() 自动建表，每个测试独立
 */
function setup() {
  const testDb = createTestDb()
  const app = new Elysia().use(new Elysia({ prefix: '/api' }).use(createUserRouter(testDb)))
  return treaty(app)
}

describe('User CRUD', () => {
  let client: ReturnType<typeof setup>

  beforeEach(() => {
    client = setup()
  })

  it('GET /api/users - 返回空列表', async () => {
    const { data, error } = await client.api.users.get()
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('POST /api/users - 创建用户', async () => {
    const { data, error, response } = await client.api.users.post({
      username: 'testuser',
      password: '123456',
      idCard: '110101199001011234',
      level: 'A',
      remark: '测试用户',
    })
    expect(error).toBeNull()
    expect(response.status).toBe(201)
    expect(data).toMatchObject({
      username: 'testuser',
      idCard: '110101199001011234',
      level: 'A',
      remark: '测试用户',
      status: true,
    })
    // 确保响应不包含密码
    expect(data).not.toHaveProperty('password')
    expect(data!.id).toBeDefined()
  })

  it('POST /api/users - 仅必填字段创建', async () => {
    const { data, error } = await client.api.users.post({
      username: 'minimal',
      password: 'abcdef',
    })
    expect(error).toBeNull()
    expect(data).toMatchObject({
      username: 'minimal',
      idCard: null,
      unitId: null,
      level: null,
      status: true,
      remark: null,
    })
  })

  it('GET /api/users/:id - 获取用户详情', async () => {
    const created = await client.api.users.post({ username: 'zhangsan', password: '123456' })
    const id = created.data!.id

    const { data, error } = await client.api.users({ id }).get()
    expect(error).toBeNull()
    expect(data).toMatchObject({ id, username: 'zhangsan' })
    expect(data).not.toHaveProperty('password')
  })

  it('GET /api/users/:id - 404 不存在的用户', async () => {
    const { error, response } = await client.api.users({ id: 'nonexistent' }).get()
    expect(response.status).toBe(404)
    expect(error).toBeTruthy()
  })

  it('PUT /api/users/:id - 更新用户', async () => {
    const created = await client.api.users.post({ username: 'oldname', password: '123456' })
    const id = created.data!.id

    const { data, error } = await client.api.users({ id }).put({
      username: 'newname',
      level: 'B',
      remark: '已更新',
    })
    expect(error).toBeNull()
    expect(data).toMatchObject({ id, username: 'newname', level: 'B', remark: '已更新' })
    expect(data).not.toHaveProperty('password')
  })

  it('PUT /api/users/:id - 404 更新不存在的用户', async () => {
    const { error, response } = await client.api.users({ id: 'nonexistent' }).put({ username: 'test' })
    expect(response.status).toBe(404)
    expect(error).toBeTruthy()
  })

  it('PUT /api/users/:id - 更新状态为停用', async () => {
    const created = await client.api.users.post({ username: 'disableme', password: '123456' })
    const id = created.data!.id

    const { data, error } = await client.api.users({ id }).put({ status: false })
    expect(error).toBeNull()
    expect(data!.status).toBe(false)
  })

  it('DELETE /api/users/:id - 软删除用户', async () => {
    const created = await client.api.users.post({ username: 'deleteme', password: '123456' })
    const id = created.data!.id

    const { data, error } = await client.api.users({ id }).delete()
    expect(error).toBeNull()
    expect(data).toMatchObject({ id })
    expect(data!.deletedAt).toBeTruthy()

    // 确认列表中不再包含已删除用户
    const list = await client.api.users.get()
    const found = list.data!.find((u: any) => u.id === id)
    expect(found).toBeUndefined()
  })

  it('DELETE /api/users/:id - 404 删除不存在的用户', async () => {
    const { error, response } = await client.api.users({ id: 'nonexistent' }).delete()
    expect(response.status).toBe(404)
    expect(error).toBeTruthy()
  })

  it('POST /api/users - 验证失败（密码太短）', async () => {
    const { error, response } = await client.api.users.post({ username: 'test', password: '123' })
    expect(response.status).toBe(422)
    expect(error).toBeTruthy()
  })

  it('POST /api/users - 验证失败（用户名为空）', async () => {
    const { error, response } = await client.api.users.post({ username: '', password: '123456' })
    expect(response.status).toBe(422)
    expect(error).toBeTruthy()
  })

  it('GET /api/users - 所有用户响应不含密码', async () => {
    await client.api.users.post({ username: 'user1', password: 'pass111' })
    await client.api.users.post({ username: 'user2', password: 'pass222' })

    const { data } = await client.api.users.get()
    for (const user of data!) {
      expect(user).not.toHaveProperty('password')
    }
  })
})
