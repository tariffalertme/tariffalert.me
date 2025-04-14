import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

class TelemetryService {
  private static instance: TelemetryService;
  private sdk: NodeSDK;

  private constructor() {
    // Enable OpenTelemetry debugging in development
    if (process.env.NODE_ENV === 'development') {
      diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
    }

    const resource = Resource.default().merge(
      new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'tariffalert',
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      })
    );

    // Configure exporters
    const spanProcessor = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
      ? new BatchSpanProcessor(new OTLPTraceExporter())
      : new BatchSpanProcessor(new ConsoleSpanExporter());

    this.sdk = new NodeSDK({
      resource,
      spanProcessor,
      instrumentations: [getNodeAutoInstrumentations()],
    });
  }

  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  public async start(): Promise<void> {
    try {
      await this.sdk.start();
      console.log('Telemetry service started successfully');
    } catch (error) {
      console.error('Error starting telemetry service:', error);
    }
  }

  public async shutdown(): Promise<void> {
    try {
      await this.sdk.shutdown();
      console.log('Telemetry service shut down successfully');
    } catch (error) {
      console.error('Error shutting down telemetry service:', error);
    }
  }
}

export const telemetry = TelemetryService.getInstance(); 