import { t } from 'elysia'

/** 电影完整信息（响应体） */
export const Movie = t.Object({
  id: t.Number({ description: '电影 ID' }),
  title: t.String({ description: '电影名称' }),
  releaseYear: t.Number({ description: '上映年份' }),
})

/** 创建电影请求体 */
export const CreateMovie = t.Object({
  title: t.String({ minLength: 1, description: '电影名称' }),
  releaseYear: t.Number({ minimum: 1888, description: '上映年份，不早于 1888 年' }),
})

/** 更新电影请求体，所有字段可选 */
export const UpdateMovie = t.Object({
  title: t.Optional(t.String({ minLength: 1, description: '电影名称' })),
  releaseYear: t.Optional(t.Number({ minimum: 1888, description: '上映年份，不早于 1888 年' })),
})

/** 错误响应体 */
export const MovieError = t.Object({
  message: t.String({ description: '错误信息' }),
})

export type MovieType = typeof Movie.static
export type CreateMovieType = typeof CreateMovie.static
export type UpdateMovieType = typeof UpdateMovie.static
