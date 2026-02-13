// src/utils/logger.ts
// Winston logger configuration

import winston from 'winston';
import path from 'path';
import config from '../config';

const logDir = 'logs';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

// Define log format for console (with colors)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
  })
);

// Create transports array
const transports: winston.transport[] = [];

// Always add console transport
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
  })
);

// Add file transports in production
if (config.isProd) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: logFormat,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format: logFormat,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: config.isDev ? 'debug' : 'info',
  format: logFormat,
  transports,
  exitOnError: false,
});

export default logger;
