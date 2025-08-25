export interface LogContext {
  userId?: string
  action?: string
  data?: any
  error?: Error
}

export class Logger {
  private static instance: Logger

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  info(message: string, context?: LogContext) {
    this.log('INFO', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('WARN', message, context)
  }

  error(message: string, context?: LogContext) {
    this.log('ERROR', message, context)
  }

  private log(level: string, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
      error: context?.error ? {
        message: context.error.message,
        stack: context.error.stack,
        name: context.error.name,
      } : undefined,
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(logEntry, null, 2))
    } else {
      // In production, you might want to send logs to a service like LogRocket, Sentry, etc.
      console.log(JSON.stringify(logEntry))
    }
  }
}

export const logger = Logger.getInstance()
