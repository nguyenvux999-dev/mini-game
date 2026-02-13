// src/index.ts
// Application entry point

import createApp from './app';
import config from './config';
import { connectDatabase, disconnectDatabase } from './config/database';
import logger from './utils/logger';

/**
 * Start the server
 */
async function bootstrap(): Promise<void> {
  try {
    // Connect to database
    await connectDatabase();

    // Create Express app
    const app = createApp();

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info('🚀 ==============================================');
      logger.info(`🚀 Server is running on port ${config.port}`);
      logger.info(`🚀 Environment: ${config.nodeEnv}`);
      logger.info(`🚀 API URL: http://localhost:${config.port}/api`);
      logger.info('🚀 ==============================================');
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed.');
        
        await disconnectDatabase();
        
        logger.info('Graceful shutdown completed.');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Rejection:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
bootstrap();
