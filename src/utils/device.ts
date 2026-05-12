/** 设备信息工具 */

export interface DeviceInfo {
  deviceType: string
  deviceModel?: string | null
  appVersion?: string | null
  osVersion?: string | null
}

/** 从请求头提取设备信息 */
export function getDeviceInfo(request: Request): DeviceInfo {
  const userAgent = request.headers.get('user-agent') || ''
  const deviceType = userAgent.includes('iPhone')
    ? 'ios'
    : userAgent.includes('Android')
      ? 'android'
      : 'web'

  return {
    deviceType,
    deviceModel: request.headers.get('x-device-model') ?? undefined,
    appVersion: request.headers.get('x-app-version') ?? undefined,
    osVersion: request.headers.get('x-os-version') ?? undefined,
  }
}

/** 从请求头提取客户端 IP */
export function getClientIP(request: Request, server?: { requestIP?: (req: Request) => { address: string } | null } | null): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || server?.requestIP?.(request)?.address
    || '127.0.0.1'
  )
}
