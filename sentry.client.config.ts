import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  // Enable performance monitoring
  integrations: [],
  // Set sampling rates
  sampleRate: 1.0,
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
}); 