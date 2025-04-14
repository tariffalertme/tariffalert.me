import { telemetry } from './services/TelemetryService';

export async function initTelemetry() {
  if (process.env.NODE_ENV !== 'test') {
    await telemetry.init();
  }
}

export async function shutdownTelemetry() {
  if (process.env.NODE_ENV !== 'test') {
    await telemetry.shutdown();
  }
} 