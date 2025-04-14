import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('tariffalert');

export const createSpan = (name: string, fn: () => Promise<any>) => {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    } finally {
      span.end();
    }
  });
};

export const addSpanAttribute = (key: string, value: string | number | boolean) => {
  const currentSpan = trace.getSpan(context.active());
  if (currentSpan) {
    currentSpan.setAttribute(key, value);
  }
};

export const addSpanEvent = (name: string, attributes?: Record<string, string | number | boolean>) => {
  const currentSpan = trace.getSpan(context.active());
  if (currentSpan) {
    currentSpan.addEvent(name, attributes);
  }
}; 