import process from 'node:process'
import chalk from 'chalk'
import { format } from 'logform'
import winston from 'winston'

const timestamp = winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })

const methodColors: Record<string, (s: string) => string> = {
  GET: chalk.green,
  POST: chalk.yellow,
  PUT: chalk.blue,
  PATCH: chalk.magenta,
  DELETE: chalk.red,
}

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(timestamp, winston.format.json()),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
})

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        format(info => (info.method && info.path ? info : false))(),
        winston.format.printf(({ level, method, path, ip, duration, code, error }) => {
          const colorize = methodColors[method as string] ?? chalk.white
          const m = colorize(String(method).padEnd(6))

          if (level === 'error') {
            return `${chalk.bgRed.white(' ERR ')} ${m} ${chalk.white(path)} ${chalk.gray(ip)} ${chalk.gray('→')} ${chalk.red(String(code))} ${chalk.red(error ?? '')} ${chalk.gray(duration)}`
          }

          return `${chalk.bgCyan.black(' REQ ')} ${m} ${chalk.white(path)} ${chalk.gray(ip)} ${chalk.gray('→')} ${chalk.gray(duration)}`
        }),
      ),
    }),
  )
}
