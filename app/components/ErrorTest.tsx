'use client';

import { errorLogger } from '@/lib/services/ErrorLoggingService';
import { Button } from '@/components/ui/button';

export function ErrorTest() {
  const testError = () => {
    try {
      // Simulate an error
      throw new Error('Test error from ErrorTest component');
    } catch (error) {
      errorLogger.captureError(error as Error, {
        component: 'ErrorTest',
        action: 'testError',
        timestamp: new Date().toISOString(),
      });
    }
  };

  const testMessage = () => {
    errorLogger.captureMessage('Test message from ErrorTest component', 'info', {
      component: 'ErrorTest',
      action: 'testMessage',
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-xl font-bold">Error Logging Test</h2>
      <div className="flex gap-4">
        <Button onClick={testError} variant="destructive">
          Test Error
        </Button>
        <Button onClick={testMessage} variant="secondary">
          Test Message
        </Button>
      </div>
    </div>
  );
} 