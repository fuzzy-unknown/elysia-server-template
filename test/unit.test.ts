import { treaty } from '@elysia/eden'
import { beforeEach, describe, expect, it } from 'bun:test'
import { Elysia } from 'elysia'
import { createUnitRouter } from '../src/modules/unit'
import { createTestDb } from './setup'

/**
 * 创建测试用的 Elysia 应用和 Eden Treaty 客户端
 * - 使用内存 SQLite，通过 migrate() 自动建表，每个测试独立
 */
function setup() {
  const testDb = createTestDb()
  const app = new Elysia().use(new Elysia({ prefix: '/api' }).use(createUnitRouter(testDb)))
  return treaty(app)
}

describe('Unit CRUD', () => {
  let client: ReturnType<typeof setup>

  beforeEach(() => {
    client = setup()
  })

  it('GET /api/units - 返回空列表', async () => {
    const { data, error } = await client.api.units.get()
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('POST /api/units - 创建顶级单位', async () => {
    const { data, error, response } = await client.api.units.post({
      name: '北京市志愿者协会',
      shortName: '市志愿协',
    })
    expect(error).toBeNull()
    expect(response.status).toBe(201)
    expect(data).toMatchObject({
      name: '北京市志愿者协会',
      shortName: '市志愿协',
      parentId: null,
      status: true,
    })
    expect(data!.id).toBeDefined()
  })

  it('POST /api/units - 创建子单位', async () => {
    const parent = await client.api.units.post({ name: '总协会', shortName: '总会' })
    const parentId = parent.data!.id

    const { data, error } = await client.api.units.post({
      name: '区分会',
      shortName: '分会',
      parentId,
    })
    expect(error).toBeNull()
    expect(data).toMatchObject({ name: '区分会', parentId })
  })

  it('GET /api/units/:id - 获取单位详情', async () => {
    const created = await client.api.units.post({ name: '测试单位', shortName: '测试' })
    const id = created.data!.id

    const { data, error } = await client.api.units({ id }).get()
    expect(error).toBeNull()
    expect(data).toMatchObject({ id, name: '测试单位', shortName: '测试' })
  })

  it('GET /api/units/:id - 404 不存在的单位', async () => {
    const { error, response } = await client.api.units({ id: 'nonexistent' }).get()
    expect(response.status).toBe(404)
    expect(error).toBeTruthy()
  })

  it('PUT /api/units/:id - 更新单位', async () => {
    const created = await client.api.units.post({ name: '旧名称', shortName: '旧' })
    const id = created.data!.id

    const { data, error } = await client.api.units({ id }).put({ name: '新名称' })
    expect(error).toBeNull()
    expect(data).toMatchObject({ id, name: '新名称', shortName: '旧' })
  })

  it('PUT /api/units/:id - 404 更新不存在的单位', async () => {
    const { error, response } = await client.api.units({ id: 'nonexistent' }).put({ name: '测试' })
    expect(response.status).toBe(404)
    expect(error).toBeTruthy()
  })

  it('DELETE /api/units/:id - 软删除单位', async () => {
    const created = await client.api.units.post({ name: '待删除', shortName: '删' })
    const id = created.data!.id

    const { data, error } = await client.api.units({ id }).delete()
    expect(error).toBeNull()
    expect(data).toMatchObject({ id })
    expect(data!.deletedAt).toBeTruthy()

    // 确认列表中不再包含已删除单位
    const list = await client.api.units.get()
    const found = list.data!.find((u: any) => u.id === id)
    expect(found).toBeUndefined()
  })

  it('DELETE /api/units/:id - 404 删除不存在的单位', async () => {
    const { error, response } = await client.api.units({ id: 'nonexistent' }).delete()
    expect(response.status).toBe(404)
    expect(error).toBeTruthy()
  })

  it('POST /api/units - 验证失败（空名称）', async () => {
    const { error, response } = await client.api.units.post({ name: '', shortName: '测试' })
    expect(response.status).toBe(422)
    expect(error).toBeTruthy()
  })
})

describe('Unit Tree', () => {
  let client: ReturnType<typeof setup>

  beforeEach(() => {
    client = setup()
  })

  it('GET /api/units/tree - 返回空树', async () => {
    const { data, error } = await client.api.units.tree.get()
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('GET /api/units/tree - 返回正确的树结构', async () => {
    // 构建三级树：总部 → 分会 → 支部
    const root = await client.api.units.post({ name: '总部', shortName: '总部' })
    const rootId = root.data!.id

    const child1 = await client.api.units.post({ name: '分会A', shortName: '分会A', parentId: rootId })
    const child1Id = child1.data!.id

    const _child2 = await client.api.units.post({ name: '分会B', shortName: '分会B', parentId: rootId })

    const _grandchild = await client.api.units.post({ name: '支部A1', shortName: '支部A1', parentId: child1Id })

    const { data, error } = await client.api.units.tree.get()
    expect(error).toBeNull()

    // 根节点只有1个（总部）
    expect(data!.length).toBe(1)
    const tree = data![0] as any
    expect(tree.name).toBe('总部')

    // 总部下有2个子节点
    expect(tree.children.length).toBe(2)

    // 分会A下有1个子节点
    const branchA = tree.children.find((c: any) => c.name === '分会A')
    expect(branchA).toBeDefined()
    expect(branchA.children.length).toBe(1)
    expect(branchA.children[0].name).toBe('支部A1')

    // 分会B下没有子节点
    const branchB = tree.children.find((c: any) => c.name === '分会B')
    expect(branchB.children).toEqual([])
  })

  it('GET /api/units/tree - 软删除的节点不出现在树中', async () => {
    const parent = await client.api.units.post({ name: '父单位', shortName: '父' })
    const parentId = parent.data!.id
    await client.api.units.post({ name: '子单位', shortName: '子', parentId })

    // 删除父单位后，子单位变为孤儿节点，在树中成为根节点
    await client.api.units({ id: parentId }).delete()

    const { data } = await client.api.units.tree.get()
    // 已删除的父单位不在树中，子单位成为顶级节点
    const tree = data! as any[]
    expect(tree.find((u: any) => u.id === parentId)).toBeUndefined()
    expect(tree.length).toBe(1)
    expect(tree[0].name).toBe('子单位')
  })
})
