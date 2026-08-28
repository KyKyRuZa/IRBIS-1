import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import employeeRoutes from './routes/employeeRoutes.js';
import siteRoutes from './routes/siteRoutes.js';
import itemTypeRoutes from './routes/itemTypeRoutes.js';
import issueNormRoutes from './routes/issueNormRoutes.js';
import issueRecordRoutes from './routes/issueRecordRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import exportRoutes from './routes/exportRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import formRoutes from './routes/formRoutes.js';
import pushRoutes from './routes/pushRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import logRoutes from './routes/logRoutes.js';
import { logger, runWithRequestContext, getRequestLogger } from './utils/logger.js';
import { initDB, pool } from './models/db.js';
import { aggregateNotifications } from './services/notificationService.js';
import { cookiesMiddleware } from './middleware/auth.js';

import rateLimit from 'express-rate-limit';

const isProd = process.env.NODE_ENV === 'production';
const rateLimitDisabled = process.env.RATE_LIMIT_DISABLED === 'true';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => rateLimitDisabled,
  message: { error: 'Too many login attempts, please try again later' },
});

const globalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => rateLimitDisabled,
  message: { error: 'Too many requests, please try again later' },
});

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
}

function requestLogger(req, res, next) {
  const reqId = req.headers['x-request-id'] || randomUUID();
  req.id = reqId;
  const log = logger.child({ reqId });
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    log[level]({ method: req.method, url: req.originalUrl, status: res.statusCode, durationMs });
  });
  runWithRequestContext(reqId, log, next);
}

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || false, credentials: true }));
app.use(securityHeaders);
app.use(cookiesMiddleware);
app.use(express.json());
app.use(requestLogger);
app.use('/uploads', express.static('uploads', {
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
}));
app.use('/certs', express.static('certs', {
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
}));
app.use('/api', globalLimiter);

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/items', itemTypeRoutes);
app.use('/api/norms', issueNormRoutes);
app.use('/api/issues', issueRecordRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/log', logRoutes);

app.use((err, req, res, next) => {
  getRequestLogger().error({ err, method: req.method, url: req.originalUrl }, err.message || 'Request failed');
  const status = err.status || 500;
  const message = isProd ? 'Internal Server Error' : (err.message || 'Internal Server Error');
  res.status(status).json({ error: message });
});

app.use((req, res) => {
  getRequestLogger().warn({ method: req.method, url: req.originalUrl }, 'Route not found');
  res.status(404).json({ error: 'Not found' });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (err) => {
  logger.error(err, 'Uncaught exception, shutting down');
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

const gracefulShutdown = async () => {
  logger.info('Received shutdown signal, closing database pool...');
  try {
    await pool.end();
    logger.info('Database pool closed');
  } catch (err) {
    logger.error(err, 'Error closing database pool');
  }
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

if (process.env.NODE_ENV !== 'test') {
  initDB().then(() => {
    aggregateNotifications().catch(err => logger.error(err, 'Initial notification aggregation failed'));
    cron.schedule('0 8 * * *', () => {
      aggregateNotifications().catch(err => logger.error(err, 'Notification job failed'));
    });
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  });
}

export default app;
