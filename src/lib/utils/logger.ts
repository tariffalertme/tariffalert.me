type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMetadata {
  [key: string]: unknown;
}

export class Logger {
  private readonly context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatMessage(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
    return `[${timestamp}] ${level.toUpperCase()} [${this.context}] ${message}${metadataStr}`;
  }

  info(message: string, metadata?: LogMetadata): void {
    console.info(this.formatMessage('info', message, metadata));
  }

  warn(message: string, metadata?: LogMetadata): void {
    console.warn(this.formatMessage('warn', message, metadata));
  }

  error(message: string, metadata?: LogMetadata): void {
    console.error(this.formatMessage('error', message, metadata));
  }

  debug(message: string, metadata?: LogMetadata): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage('debug', message, metadata));
    }
  }
} 