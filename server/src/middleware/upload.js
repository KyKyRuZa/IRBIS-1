import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { childLogger } from '../utils/logger.js';

const log = childLogger('upload');

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = file.fieldname === 'certificate' ? 'certificates' : 'signatures';
    const dir = path.join(uploadDir, subDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExt = /\.(pdf|png|jpe?g|gif|webp)$/i;
  const allowedMime = /^(application\/pdf|image\/(png|jpeg|gif|webp))$/;
  const ext = allowedExt.test(path.extname(file.originalname));
  const mime = allowedMime.test(file.mimetype);
  if (ext && mime) {
    cb(null, true);
  } else {
    log.warn({ originalname: file.originalname, mimetype: file.mimetype }, 'Rejected upload: unsupported file type');
    cb(new Error('Only PDF and image files are allowed'), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});
