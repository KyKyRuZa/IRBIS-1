const LEVELS = { debug: 20, info: 30, warn: 40, error: 50 };

const SENSITIVE = new Set([
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'authorization',
  'cookie',
  'cookies',
  'set-cookie',
  'p256dh',
  'auth',
  'secret',
  'new_password',
  'old_password',
  'newpassword',
  'oldpassword',
]);

function redact(value) {
  if (!value || typeof value !== 'object') return value;
  const out = Array.isArray(value) ? [] : {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE.has(String(key).toLowerCase())) {
      out[key] = '[redacted]';
    } else if (val && typeof val === 'object') {
      out[key] = redact(val);
    } else {
      out[key] = val;
    }
  }
  return out;
}

function parseArgs(args) {
  let message = '';
  let ctx = {};
  for (const arg of args) {
    if (arg instanceof Error) {
      ctx.error = { name: arg.name, message: arg.message, stack: arg.stack };
    } else if (typeof arg === 'string') {
      message = message ? `${message} ${arg}` : arg;
    } else if (arg && typeof arg === 'object') {
      ctx = { ...ctx, ...arg };
    }
  }
  return { message, ctx };
}

function sendToServer(record) {
  if (typeof window === 'undefined' || !window.navigator) return;
  try {
    const payload = JSON.stringify(record);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/log', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/log', { method: 'POST', body: payload, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(() => {});
    }
  } catch {
    /* best effort */
  }
}

class Logger {
  constructor(module, bindings = {}) {
    this.module = module;
    this.bindings = bindings;
  }

  child(module) {
    return new Logger(module, this.bindings);
  }

  _log(level, args) {
    const { message, ctx } = parseArgs(args);
    const record = {
      time: new Date().toISOString(),
      level,
      source: 'client',
      module: this.module,
      message,
      ...redact({ ...this.bindings, ...ctx }),
    };

    const consoleLevel = level === 'debug' ? 'debug' : level;
    if (import.meta.env?.DEV) {
      // eslint-disable-next-line no-console
      console[consoleLevel](JSON.stringify(record));
    }
    if (level === 'warn' || level === 'error') {
      sendToServer(record);
    }
  }

  debug(...args) { this._log('debug', args); }
  info(...args) { this._log('info', args); }
  warn(...args) { this._log('warn', args); }
  error(...args) { this._log('error', args); }
}

export const logger = new Logger('browser');
export function childLogger(module) {
  return logger.child(module);
}
export default logger;
