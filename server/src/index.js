import 'dotenv/config';
import express from 'express';
import cors from 'cors';
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
import { initDB } from './models/db.js';

const app = express();
app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 5000;

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
