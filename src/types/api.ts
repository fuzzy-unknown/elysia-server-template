/** API 响应基础类型 */

/** 成功响应结构 */
export interface ApiSuccessResponse<T> {
  success: true
  message: string
  data: T
}

/** 错误响应结构 */
export interface ApiErrorResponse {
  success: false
  message: string
  code: string
}

/** 分页请求参数 */
export interface PaginationParams {
  page?: number
  pageSize?: number
}

/** 分页响应结构 */
export interface PaginatedResponse<T> {
  success: true
  message: string
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}
