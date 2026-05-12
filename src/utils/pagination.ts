/**
 * 通用分页查询工具
 *
 * 提供统一的分页参数解析和响应格式化
 */

/** 分页参数 */
export interface PaginationParams {
  /** 页码，从 1 开始 */
  page?: number
  /** 每页数量 */
  pageSize?: number
}

/** 分页元数据 */
export interface PaginationMeta {
  /** 当前页码 */
  page: number
  /** 每页数量 */
  pageSize: number
  /** 总记录数 */
  total: number
  /** 总页数 */
  totalPages: number
  /** 是否有上一页 */
  hasPrev: boolean
  /** 是否有下一页 */
  hasNext: boolean
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  success: true
  message: string
  data: T[]
  pagination: PaginationMeta
}

/** 默认配置 */
const defaultConfig = {
  /** 默认页码 */
  defaultPage: 1,
  /** 默认每页数量 */
  defaultPageSize: 10,
  /** 最大每页数量 */
  maxPageSize: 100,
}

/**
 * 解析分页参数
 * @param params - 查询参数
 * @param config - 配置选项
 * @returns 标准化的分页参数
 */
export function parsePagination(
  params: PaginationParams,
  config: typeof defaultConfig = defaultConfig,
): Required<PaginationParams> {
  const page = Math.max(1, params.page || config.defaultPage)
  const pageSize = Math.min(
    config.maxPageSize,
    Math.max(1, params.pageSize || config.defaultPageSize),
  )

  return { page, pageSize }
}

/**
 * 计算分页元数据
 * @param page - 当前页码
 * @param pageSize - 每页数量
 * @param total - 总记录数
 * @returns 分页元数据
 */
export function calculatePaginationMeta(
  page: number,
  pageSize: number,
  total: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / pageSize)

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  }
}

/**
 * 格式化分页响应
 * @param data - 数据列表
 * @param total - 总记录数
 * @param page - 当前页码
 * @param pageSize - 每页数量
 * @param message - 响应消息
 * @returns 分页响应对象
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
  message = '操作成功',
): PaginatedResponse<T> {
  return {
    success: true,
    message,
    data,
    pagination: calculatePaginationMeta(page, pageSize, total),
  }
}

/**
 * 计算偏移量（用于 SQL LIMIT/OFFSET）
 * @param page - 页码
 * @param pageSize - 每页数量
 * @returns offset 值
 */
export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize
}
