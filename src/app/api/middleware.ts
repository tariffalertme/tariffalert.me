import { initTelemetry } from '@/lib/telemetry';

// Initialize OpenTelemetry
initTelemetry();

export async function middleware(request: Request) {
  // Your existing middleware code
} 