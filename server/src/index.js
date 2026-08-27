import 'dotenv/config';
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
import { logger } from './utils/logger.js';
import { initDB } from './models/db.js';
import { aggregateNotifications } from './services/notificationService.js';
import { cookiesMiddleware } from './middleware/auth.js';

import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

const app = express();
app.set('trust proxy', 1);
const allowedOrigins = (process.env.CORS_ORIGIN || 'https://irbis.cloud-ip.cc')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(cookiesMiddleware);
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/certs', express.static('certs'));

app.use('/api/auth/login', loginLimiter);
app.use('/api', apiLimiter);
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

app.use((err, req, res, next) => {
  logger.error(err);
  const status = err.status || 500;
  const message = status >= 500 ? 'Internal server error' : (err.message || 'Error');
  res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 5000;


const gracefulShutdown = async () => {
  console.log('Received shutdown signal, closing database pool...');
  try {
    await pool.end();
    console.log('Database pool closed');
  } catch (err) {
    logger.error('Error closing database pool:', err);
  }
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
initDB().then(() => {
  aggregateNotifications().catch(err => console.error('Initial notification aggregation failed:', err));
  cron.schedule('0 8 * * *', () => {
    aggregateNotifications().catch(err => console.error('Notification job failed:', err));
  });
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
});
