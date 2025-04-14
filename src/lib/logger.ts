import config from './config';

export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private formatMessage(level: string, message: string): string {
    return `[${level}] [${this.context}] ${message}`;
  }

  info(message: string, ...args: any[]): void {
    if (!config.isTest) {
      console.info(this.formatMessage('INFO', message), ...args);
    }
  }

  error(message: string, error?: Error, ...args: any[]): void {
    if (!config.isTest) {
      console.error(this.formatMessage('ERROR', message), error?.stack || '', ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (!config.isTest) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (config.isDevelopment) {
      console.debug(this.formatMessage('DEBUG', message), ...args);
    }
  }
}

export default Logger; 