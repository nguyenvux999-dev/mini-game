// src/app.ts
// Express application setup

import express, { Express, json, urlencoded } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import config from './config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { apiLimiter } from './middlewares/rateLimit.middleware';
import logger from './utils/logger';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // ==========================================================================
  // SECURITY MIDDLEWARES
  // ==========================================================================
  
  // Helmet - Security headers (XSS Protection, HSTS, etc.)
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin for images
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    xssFilter: true, // Enable X-XSS-Protection header
    noSniff: true, // Enable X-Content-Type-Options: nosniff
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  // CORS configuration - Chỉ cho phép Frontend gọi API
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      // Development mode: Allow all origins (for VS Code Dev Tunnels, ngrok, etc.)
      if (config.nodeEnv === 'development') {
        return callback(null, true);
      }
      
      // Production mode: Whitelist specific origins
      const allowedOrigins = [
        config.cors.origin,
        'http://localhost:3000',
        'http://localhost:4000',
        'https://minigame-26dm.vercel.app',
      ];
      
      // Also allow VS Code Dev Tunnels in any environment
      const isDevTunnel = origin.includes('.devtunnels.ms');
      
      if (allowedOrigins.includes(origin) || isDevTunnel) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Player-Token',
      'X-Requested-With',
    ],
  }));

  // HPP - HTTP Parameter Pollution Protection
  // Chống tấn công: ?sort=asc&sort=desc
  app.use(hpp({
    whitelist: ['page', 'limit', 'status'], // Cho phép duplicate các params này
  }));

  // ==========================================================================
  // BODY PARSING MIDDLEWARES
  // ==========================================================================
  
  // Parse JSON bodies - Giới hạn 10kb để chống DoS attacks
  app.use(json({ 
    limit: '10kb',
    strict: true, // Chỉ chấp nhận arrays và objects
  }));
  
  // Parse URL-encoded bodies
  app.use(urlencoded({ 
    extended: true, 
    limit: '10kb',
    parameterLimit: 50, // Giới hạn số lượng parameters
  }));

  // ==========================================================================
  // LOGGING MIDDLEWARE
  // ==========================================================================
  
  // HTTP request logging
  if (config.isDev) {
    // Development: colorful output
    app.use(morgan('dev'));
  } else {
    // Production: combined format
    app.use(morgan('combined', {
      stream: {
        write: (message: string) => {
          logger.info(message.trim());
        },
      },
    }));
  }

  // ==========================================================================
  // STATIC FILES
  // ==========================================================================
  
  // Serve uploaded files
  app.use('/uploads', express.static(config.upload.uploadDir));

  // ==========================================================================
  // RATE LIMITING
  // ==========================================================================
  
  // Apply general rate limiting to all API routes
  app.use('/api', apiLimiter);

  // ==========================================================================
  // API ROUTES
  // ==========================================================================
  
  // Mount all API routes under /api
  app.use('/api', routes);

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================
  
  // Handle 404 - Route not found
  app.use(notFoundHandler);
  
  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}

export default createApp;
