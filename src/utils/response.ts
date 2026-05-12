/** 统一 API 响应工具 */

/** 成功响应 */
export function successResponse<T>(data: T, message?: string) {
  return {
    success: true,
    message: message || '操作成功',
    data,
  }
}

/** 错误响应 */
export function errorResponse(message: string, code?: string) {
  return {
    success: false,
    message,
    code: code || 'ERROR',
  }
}
