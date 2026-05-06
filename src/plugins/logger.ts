/**
 * 日志配置（Winston）
 *
 * 双通道输出策略：
 * 1. 文件输出（始终启用）
 *    - logs/error.log  —— 仅记录 error 级别日志
 *    - logs/combined.log —— 记录所有级别日志
 *    - 格式：JSON + 时间戳，便于日志分析工具解析
 *
 * 2. 控制台输出（仅开发环境 NODE_ENV !== 'production'）
 *    - 彩色格式化输出请求信息（方法、路径、IP、耗时）
 *    - 按 HTTP 方法着色：GET=绿 POST=黄 PUT=蓝 PATCH=紫 DELETE=红
 *    - 请求成功显示 [REQ]，错误显示 [ERR]
 */
import process from 'node:process'
import chalk from 'chalk'
import { format } from 'logform'
import winston from 'winston'

const timestamp = winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })

/** HTTP 方法对应的控制台颜色映射 */
const methodColors: Record<string, (s: string) => string> = {
  GET: chalk.green,
  POST: chalk.yellow,
  PUT: chalk.blue,
  PATCH: chalk.magenta,
  DELETE: chalk.red,
}

/**
 * Winston Logger 实例
 * - 生产环境：仅写入文件（JSON 格式，方便 ELK 等工具采集）
 * - 开发环境：额外输出到控制台（彩色可读格式）
 */
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(timestamp, winston.format.json()),
  transports: [
    // 错误日志单独存放，便于快速定位问题
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // 全量日志
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
})

// 开发环境添加控制台输出，使用彩色格式化
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        // 只输出包含 method 和 path 的请求日志，过滤掉纯文本日志
        format(info => (info.method && info.path ? info : false))(),
        winston.format.printf(({ level, method, path, ip, duration, code, error }) => {
          const colorize = methodColors[method as string] ?? chalk.white
          const m = colorize(String(method).padEnd(6))

          // 错误请求：红色背景 + 状态码 + 错误信息
          if (level === 'error') {
            return `${chalk.bgRed.white(' ERR ')} ${m} ${chalk.white(path)} ${chalk.gray(ip)} ${chalk.gray('→')} ${chalk.red(String(code))} ${chalk.red(error ?? '')} ${chalk.gray(duration)}`
          }

          // 正常请求：青色背景
          return `${chalk.bgCyan.black(' REQ ')} ${m} ${chalk.white(path)} ${chalk.gray(ip)} ${chalk.gray('→')} ${chalk.gray(duration)}`
        }),
      ),
    }),
  )
}
