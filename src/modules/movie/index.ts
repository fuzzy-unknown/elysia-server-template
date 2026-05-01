import { Elysia, t } from 'elysia'
import { db } from '../../db'
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { MovieService } from './service'
import { Movie, CreateMovie, UpdateMovie, MovieError } from './model'

/**
 * 创建电影路由
 * @param database 数据库实例，默认使用生产数据库；测试时可传入内存数据库
 */
export const createMovieRouter = (database: BunSQLiteDatabase = db) => {
  const movieService = new MovieService(database)

  return new Elysia({ prefix: '/movies' })
    .decorate({ movieService })
    // 注册 TypeBox 模型，供 OpenAPI 文档和请求/响应校验使用
    .model({
      'movie': Movie,
      'movie.create': CreateMovie,
      'movie.update': UpdateMovie,
      'movie.error': MovieError,
    })
    .get('/', ({ movieService }) => movieService.getAll(), {
      detail: {
        summary: '获取所有电影',
        tags: ['电影'],
      },
      response: {
        200: t.Array(Movie),
      },
    })
    .get('/:id', ({ movieService, params: { id }, status }) => {
      const movie = movieService.getById(id)
      if (!movie) return status(404, { message: 'Movie not found' })
      return movie
    }, {
      detail: {
        summary: '根据 ID 获取电影',
        tags: ['电影'],
      },
      params: t.Object({ id: t.Number({ minimum: 1 }) }),
      response: {
        200: Movie,
        404: MovieError,
      },
    })
    .post('/', ({ movieService, body, status }) => {
      return status(201, movieService.create(body))
    }, {
      detail: {
        summary: '创建电影',
        tags: ['电影'],
      },
      body: CreateMovie,
      response: {
        201: Movie,
      },
    })
    .put('/:id', ({ movieService, params: { id }, body, status }) => {
      const movie = movieService.update(id, body)
      if (!movie) return status(404, { message: 'Movie not found' })
      return movie
    }, {
      detail: {
        summary: '更新电影',
        tags: ['电影'],
      },
      params: t.Object({ id: t.Number({ minimum: 1 }) }),
      body: UpdateMovie,
      response: {
        200: Movie,
        404: MovieError,
      },
    })
    .delete('/:id', ({ movieService, params: { id }, status }) => {
      const movie = movieService.remove(id)
      if (!movie) return status(404, { message: 'Movie not found' })
      return movie
    }, {
      detail: {
        summary: '删除电影',
        tags: ['电影'],
      },
      params: t.Object({ id: t.Number({ minimum: 1 }) }),
      response: {
        200: Movie,
        404: MovieError,
      },
    })
}

/** 默认导出：使用生产数据库的电影模块 */
export const movieModule = createMovieRouter()
