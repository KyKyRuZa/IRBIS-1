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
import { initDB } from './models/db.js';
import { aggregateNotifications } from './services/notificationService.js';

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || false, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

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
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

initDB().then(() => {
  aggregateNotifications().catch(err => console.error('Initial notification aggregation failed:', err));
  cron.schedule('0 8 * * *', () => {
    aggregateNotifications().catch(err => console.error('Notification job failed:', err));
  });
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
