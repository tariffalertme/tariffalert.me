import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const resource = Resource.default().merge(
  new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'tariffalert',
  })
);

const sdk = new NodeSDK({
  resource,
  spanProcessor: new SimpleSpanProcessor(
    new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      headers: {
        'x-honeycomb-team': process.env.HONEYCOMB_API_KEY || '',
      },
    })
  ),
  instrumentations: [getNodeAutoInstrumentations()],
});

export async function initTelemetry(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    try {
      await sdk.start();
      console.log('Telemetry initialized');
    } catch (error: unknown) {
      console.error('Error initializing telemetry:', error);
    }
  }
}

process.on('SIGTERM', async () => {
  try {
    await sdk.shutdown();
    console.log('Telemetry shut down');
  } catch (error: unknown) {
    console.error('Error shutting down telemetry:', error);
  } finally {
    process.exit(0);
  }
}); 