/** 文件处理工具 */
import { existsSync, mkdirSync } from 'node:fs'

/** 确保目录存在，不存在则创建 */
export function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
}

/** 验证图片文件 */
export interface ImageValidationResult {
  valid: boolean
  error?: string
}

export function validateImage(
  file: File,
  options?: {
    maxSizeMB?: number
    allowedTypes?: string[]
  },
): ImageValidationResult {
  const {
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  } = options || {}

  // 检查文件类型
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `只支持 ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join('、')} 格式的图片`,
    }
  }

  // 检查文件大小
  const maxSize = maxSizeMB * 1024 * 1024
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `图片大小不能超过 ${maxSizeMB}MB`,
    }
  }

  return { valid: true }
}

/** 生成唯一文件名 */
export function generateFilename(originalName: string, prefix?: string): string {
  const ext = originalName.split('.').pop() || 'jpg'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return prefix ? `${prefix}_${timestamp}_${random}.${ext}` : `${timestamp}_${random}.${ext}`
}
