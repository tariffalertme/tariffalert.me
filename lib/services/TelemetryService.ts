export class TelemetryService {
  private static instance: TelemetryService;

  private constructor() {}

  static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  async init() {
    if (process.env.NODE_ENV === 'development') {
      console.log('Telemetry service initialized in development mode');
    }
  }

  async shutdown() {
    if (process.env.NODE_ENV === 'development') {
      console.log('Telemetry service shut down');
    }
  }
}

export const telemetry = TelemetryService.getInstance(); 