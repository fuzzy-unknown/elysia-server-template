import { treaty } from '@elysia/eden'
import { describe, expect, it, beforeEach } from 'bun:test'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Elysia } from 'elysia'
import { createMovieRouter } from '../src/modules/movie'

/**
 * 创建测试用的 Elysia 应用和 Eden Treaty 客户端
 * - 使用内存 SQLite，每个测试独立、不污染生产数据
 * - 路由结构与生产环境一致（/api/movies）
 */
function setup() {
  const sqlite = new Database(':memory:')
  sqlite.run('CREATE TABLE movies (id INTEGER PRIMARY KEY, name TEXT NOT NULL, release_year INTEGER NOT NULL)')
  const testDb = drizzle(sqlite)
  const app = new Elysia().use(new Elysia({ prefix: '/api' }).use(createMovieRouter(testDb)))
  return treaty(app)
}

describe('Movie CRUD', () => {
  let client: ReturnType<typeof setup>

  // 每个测试前创建全新的内存数据库，确保测试隔离
  beforeEach(() => {
    client = setup()
  })

  it('GET /api/movies - returns empty array', async () => {
    const { data, error } = await client.api.movies.get()
    expect(error).toBeNull()
    expect(data).toEqual([])
  })

  it('POST /api/movies - creates a movie', async () => {
    const { data, error, response } = await client.api.movies.post({
      title: 'Inception',
      releaseYear: 2010,
    })
    expect(error).toBeNull()
    expect(response.status).toBe(201)
    expect(data).toMatchObject({ title: 'Inception', releaseYear: 2010 })
    expect(data!.id).toBeDefined()
  })

  it('GET /api/movies/:id - returns a movie', async () => {
    const created = await client.api.movies.post({ title: 'Interstellar', releaseYear: 2014 })
    const id = created.data!.id

    const { data, error } = await client.api.movies({ id }).get()
    expect(error).toBeNull()
    expect(data).toMatchObject({ id, title: 'Interstellar', releaseYear: 2014 })
  })

  it('GET /api/movies/:id - 404 for non-existent', async () => {
    const { error, response } = await client.api.movies({ id: 999 }).get()
    expect(response.status).toBe(404)
    expect(error).toBeTruthy()
  })

  it('PUT /api/movies/:id - updates a movie', async () => {
    const created = await client.api.movies.post({ title: 'Tenet', releaseYear: 2020 })
    const id = created.data!.id

    const { data, error } = await client.api.movies({ id }).put({ title: 'Tenet (Updated)' })
    expect(error).toBeNull()
    expect(data).toMatchObject({ id, title: 'Tenet (Updated)', releaseYear: 2020 })
  })

  it('PUT /api/movies/:id - 404 for non-existent', async () => {
    const { error, response } = await client.api.movies({ id: 999 }).put({ title: 'Nope' })
    expect(response.status).toBe(404)
    expect(error).toBeTruthy()
  })

  it('DELETE /api/movies/:id - deletes a movie', async () => {
    const created = await client.api.movies.post({ title: 'Dunkirk', releaseYear: 2017 })
    const id = created.data!.id

    const { data, error } = await client.api.movies({ id }).delete()
    expect(error).toBeNull()
    expect(data).toMatchObject({ id, title: 'Dunkirk' })

    const after = await client.api.movies({ id }).get()
    expect(after.response.status).toBe(404)
  })

  it('DELETE /api/movies/:id - 404 for non-existent', async () => {
    const { error, response } = await client.api.movies({ id: 999 }).delete()
    expect(response.status).toBe(404)
    expect(error).toBeTruthy()
  })

  it('POST /api/movies - validates body (422)', async () => {
    const { error, response } = await client.api.movies.post({ title: '', releaseYear: 1000 })
    expect(response.status).toBe(422)
    expect(error).toBeTruthy()
  })
})
