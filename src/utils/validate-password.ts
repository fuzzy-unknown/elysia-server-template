/**
 * 密码强度验证工具
 *
 * 密码安全策略：
 * - 最少 8 位，最多 100 位
 * - 必须包含大小写字母和数字
 * - 可选：包含特殊字符（增强安全性）
 *
 * 强度等级：
 * - weak: 仅满足基本要求
 * - medium: 包含三种字符类型
 * - strong: 包含四种字符类型且长度 >= 12
 */

/** 密码强度等级 */
export type PasswordStrength = 'weak' | 'medium' | 'strong'

/** 密码验证结果 */
export interface PasswordValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 强度等级 */
  strength: PasswordStrength
  /** 错误信息 */
  errors: string[]
}

/** 密码强度配置 */
export interface PasswordPolicy {
  /** 最小长度 */
  minLength: number
  /** 最大长度 */
  maxLength: number
  /** 是否必须包含大写字母 */
  requireUppercase: boolean
  /** 是否必须包含小写字母 */
  requireLowercase: boolean
  /** 是否必须包含数字 */
  requireNumbers: boolean
  /** 是否必须包含特殊字符 */
  requireSpecialChars: boolean
}

/** 默认密码策略 */
const defaultPolicy: PasswordPolicy = {
  minLength: 8,
  maxLength: 100,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
}

/**
 * 验证密码强度
 * @param password - 待验证的密码
 * @param policy - 密码策略配置（可选，使用默认策略）
 * @returns 验证结果
 */
export function validatePassword(
  password: string,
  policy: PasswordPolicy = defaultPolicy,
): PasswordValidationResult {
  const errors: string[] = []

  // 检查长度
  if (password.length < policy.minLength) {
    errors.push(`密码长度不能少于 ${policy.minLength} 位`)
  }
  if (password.length > policy.maxLength) {
    errors.push(`密码长度不能超过 ${policy.maxLength} 位`)
  }

  // 检查字符类型
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)

  if (policy.requireUppercase && !hasUppercase) {
    errors.push('密码必须包含大写字母')
  }
  if (policy.requireLowercase && !hasLowercase) {
    errors.push('密码必须包含小写字母')
  }
  if (policy.requireNumbers && !hasNumbers) {
    errors.push('密码必须包含数字')
  }
  if (policy.requireSpecialChars && !hasSpecialChars) {
    errors.push('密码必须包含特殊字符')
  }

  // 计算强度等级
  let strengthScore = 0
  if (password.length >= 8)
    strengthScore++
  if (password.length >= 12)
    strengthScore++
  if (hasUppercase)
    strengthScore++
  if (hasLowercase)
    strengthScore++
  if (hasNumbers)
    strengthScore++
  if (hasSpecialChars)
    strengthScore++

  let strength: PasswordStrength = 'weak'
  if (strengthScore >= 5) {
    strength = 'strong'
  }
  else if (strengthScore >= 3) {
    strength = 'medium'
  }

  return {
    valid: errors.length === 0,
    strength,
    errors,
  }
}

/**
 * 获取密码强度提示
 * @param strength - 强度等级
 * @returns 提示信息
 */
export function getPasswordStrengthHint(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return '密码强度较弱，建议增加长度并使用多种字符类型'
    case 'medium':
      return '密码强度中等，建议增加长度或添加特殊字符'
    case 'strong':
      return '密码强度强'
  }
}
