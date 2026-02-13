// src/routes/config.routes.ts
// Routes for Config API

import { Router } from 'express';
import { configController } from '../controllers/config.controller';
import { uploadSingle } from '../middlewares/upload.middleware';
import { uploadLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

/**
 * @route   GET /api/config
 * @desc    Get public store config, active campaign, rewards, contact
 * @access  Public
 */
router.get('/', (req, res, next) => configController.getPublicConfig(req, res, next));

/**
 * @route   GET /api/config/admin
 * @desc    Get full config for admin panel
 * @access  Admin (TODO: add auth middleware)
 */
router.get('/admin', (req, res, next) => configController.getAdminConfig(req, res, next));

/**
 * @route   PUT /api/config
 * @desc    Update store configuration
 * @access  Admin (TODO: add auth middleware)
 */
router.put('/', (req, res, next) => configController.updateConfig(req, res, next));

/**
 * @route   POST /api/config/upload-logo
 * @desc    Upload store logo
 * @access  Admin (TODO: add auth middleware)
 * @upload  Single file with field name 'file'
 * @note    File saved to uploads/logos/
 */
router.post(
  '/upload-logo',
  uploadLimiter,
  (req, res, next) => {
    req.body.type = 'logo';
    next();
  },
  uploadSingle,
  (req, res, next) => configController.uploadLogo(req, res, next)
);

/**
 * @route   POST /api/config/upload-banner
 * @desc    Upload store banner
 * @access  Admin (TODO: add auth middleware)
 * @upload  Single file with field name 'file'
 * @note    File saved to uploads/banners/
 */
router.post(
  '/upload-banner',
  uploadLimiter,
  (req, res, next) => {
    req.body.type = 'banner';
    next();
  },
  uploadSingle,
  (req, res, next) => configController.uploadBanner(req, res, next)
);

export default router;
