import { childLogger } from '@/lib/logger.js';

const log = childLogger('global');

export function initGlobalErrorHandlers() {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    log.error(
      {
        message: event.message,
        url: event.filename,
        line: event.lineno,
        col: event.colno,
        stack: event.error?.stack,
      },
      'Uncaught client error'
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    log.error(
      {
        reason: reason?.message || String(reason),
        stack: reason?.stack,
      },
      'Unhandled promise rejection'
    );
  });
}
