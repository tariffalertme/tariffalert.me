import { trace, context, Exception } from '@opentelemetry/api';

class ErrorLoggingService {
  private static instance: ErrorLoggingService;

  private constructor() {
    if (typeof window !== 'undefined') {
      // Initialize LogRocket in the browser
      import('logrocket').then((LogRocket) => {
        LogRocket.init(process.env.NEXT_PUBLIC_LOGROCKET_ID || '');
        
        // Enable console logging in development
        if (process.env.NODE_ENV === 'development') {
          LogRocket.getSessionURL((sessionURL) => {
            console.log('LogRocket session URL:', sessionURL);
          });
        }
      });
    }
  }

  public static getInstance(): ErrorLoggingService {
    if (!ErrorLoggingService.instance) {
      ErrorLoggingService.instance = new ErrorLoggingService();
    }
    return ErrorLoggingService.instance;
  }

  public captureError(error: Error, context?: Record<string, any>) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error:', error);
      if (context) {
        console.error('Context:', context);
      }
    }

    // Log to LogRocket if available
    if (typeof window !== 'undefined') {
      import('logrocket').then((LogRocket) => {
        LogRocket.captureException(error, {
          extra: context,
          tags: {
            environment: process.env.NODE_ENV || 'development',
          },
        });
      });
    }
  }

  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${level.toUpperCase()}] ${message}`, context);
    }

    // Log to LogRocket if available
    if (typeof window !== 'undefined') {
      import('logrocket').then((LogRocket) => {
        LogRocket.track(message, {
          level,
          ...context,
        });
      });
    }
  }

  public setUser(user: { id: string; email?: string; name?: string }) {
    if (typeof window !== 'undefined') {
      import('logrocket').then((LogRocket) => {
        LogRocket.identify(user.id, {
          email: user.email,
          name: user.name,
        });
      });
    }
  }

  public clearUser() {
    // LogRocket doesn't have a clear user method
    // The next identify call will override the previous one
  }
}

export const errorLogger = ErrorLoggingService.getInstance(); 