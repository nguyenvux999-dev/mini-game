// src/middlewares/upload.middleware.ts
// Multer configuration for file uploads

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { Request } from 'express';
import { ValidationError } from './error.middleware';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Subdirectories for different asset types
const assetDirs = {
  reward_icon: path.join(uploadsDir, 'rewards'),
  game_background: path.join(uploadsDir, 'backgrounds'),
  game_character: path.join(uploadsDir, 'characters'),
  game_card: path.join(uploadsDir, 'cards'),
  logo: path.join(uploadsDir, 'logos'),
  banner: path.join(uploadsDir, 'banners'),
};

// Create subdirectories
Object.values(assetDirs).forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Multer storage configuration
 * Saves files with unique names using nanoid
 */
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const type = req.body.type as keyof typeof assetDirs || 'reward_icon';
    const dir = assetDirs[type] || uploadsDir;
    cb(null, dir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${nanoid(10)}_${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

/**
 * File filter - only accept images
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ValidationError(
        `Loại file không hỗ trợ. Chỉ chấp nhận: ${allowedMimes.join(', ')}`
      )
    );
  }
};

/**
 * Multer upload middleware
 * Configuration: max 5MB per file
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/**
 * Single file upload middleware
 * Usage: upload.single('file')
 */
export const uploadSingle = upload.single('file');

/**
 * Multiple files upload middleware (max 10 files)
 * Usage: upload.array('files', 10)
 */
export const uploadMultiple = upload.array('files', 10);

/**
 * Get relative URL path for uploaded file
 */
export const getFileUrl = (filePath: string): string => {
  // Convert absolute path to relative URL
  // Example: /uploads/rewards/abc123.png
  const relativePath = filePath.replace(uploadsDir, '').replace(/\\/g, '/');
  return `/uploads${relativePath}`;
};

/**
 * Delete file from disk
 */
export const deleteFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Get full file path from URL
 */
export const getFilePath = (fileUrl: string): string => {
  // Convert URL to absolute path
  // Example: /uploads/rewards/abc123.png -> /path/to/uploads/rewards/abc123.png
  const relativePath = fileUrl.replace('/uploads', '');
  return path.join(uploadsDir, relativePath);
};
