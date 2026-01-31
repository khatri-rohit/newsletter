// ==========================================
// LOGGING UTILITY
// ==========================================

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMetadata {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  info(message: string, metadata?: LogMetadata): void {
    const formatted = this.formatMessage('info', message, metadata);
    console.log(formatted);

    if (!this.isDevelopment) {
      // Send to logging service (e.g., CloudWatch, Datadog)
      this.sendToLoggingService('info', message, metadata);
    }
  }

  warn(message: string, metadata?: LogMetadata): void {
    const formatted = this.formatMessage('warn', message, metadata);
    console.warn(formatted);

    if (!this.isDevelopment) {
      this.sendToLoggingService('warn', message, metadata);
    }
  }

  error(message: string, error?: Error | unknown, metadata?: LogMetadata): void {
    const errorMeta =
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            ...metadata,
          }
        : metadata;

    const formatted = this.formatMessage('error', message, errorMeta);
    console.error(formatted);

    if (!this.isDevelopment) {
      this.sendToLoggingService('error', message, errorMeta);

      // Also send to error tracking (e.g., Sentry)
      if (error instanceof Error) {
        this.sendToErrorTracking(error, metadata);
      }
    }
  }

  debug(message: string, metadata?: LogMetadata): void {
    if (this.isDevelopment) {
      const formatted = this.formatMessage('debug', message, metadata);
      console.debug(formatted);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private sendToLoggingService(_level: LogLevel, _message: string, _metadata?: LogMetadata): void {
    // Implement your logging service integration here
    // Examples: CloudWatch, Datadog, LogRocket, etc.

    // For now, just a placeholder
    if (typeof window === 'undefined') {
      // Server-side only
      // fetch('your-logging-endpoint', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ level, message, metadata, timestamp: new Date() })
      // }).catch(() => {});
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private sendToErrorTracking(_error: Error, _metadata?: LogMetadata): void {
    // Implement error tracking integration here
    // Example: Sentry.captureException(error, { extra: metadata });
  }

  // Performance logging
  async measureAsync<T>(label: string, fn: () => Promise<T>, metadata?: LogMetadata): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.debug(`${label} completed`, { ...metadata, duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`${label} failed`, error, { ...metadata, duration });
      throw error;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Request logging middleware helper
export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  metadata?: LogMetadata
): void {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  logger[level](`${method} ${path} ${statusCode}`, {
    method,
    path,
    statusCode,
    duration,
    ...metadata,
  });
}
