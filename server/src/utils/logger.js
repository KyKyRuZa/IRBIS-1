import pino from 'pino';
import { AsyncLocalStorage } from 'node:async_hooks';

const isPretty =
  process.env.NODE_ENV === 'development' || process.env.LOG_PRETTY === 'true';

const SENSITIVE = [
  'password',
  'passwordHash',
  'tokenHash',
  'authorization',
  'cookie',
  'set-cookie',
  'auth',
  'p256dh',
  'PGPASSWORD',
  '*.password',
  '*.passwordHash',
  '*.tokenHash',
  '*.authorization',
  '*.cookie',
  '*.set-cookie',
  '*.p256dh',
  '*.PGPASSWORD',
];

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'irbis-server' },
  timestamp: () => {
    const now = new Date();
    const moscow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (10800000));
    const pad = (n) => String(n).padStart(2, '0');
    return `,"time":"${moscow.getFullYear()}-${pad(moscow.getMonth() + 1)}-${pad(moscow.getDate())} ${pad(moscow.getHours())}:${pad(moscow.getMinutes())}:${pad(moscow.getSeconds())}"`;
  },
  redact: {
    paths: SENSITIVE,
    censor: '[REDACTED]',
  },
  formatters: {
    err(error) {
      const data = { err: { type: error.type, message: error.message } };
      if (process.env.NODE_ENV !== 'production') {
        data.err.stack = error.stack;
      }
      return data;
    },
  },
  transport: isPretty
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export function childLogger(module) {
  return logger.child({ module });
}

const requestStore = new AsyncLocalStorage();

export function runWithRequestContext(reqId, log, callback) {
  return requestStore.run({ reqId, log }, callback);
}

export function getRequestContext() {
  return requestStore.getStore();
}

export function getRequestLogger() {
  return requestStore.getStore()?.log ?? logger;
}
