import http from 'http';
import { Worker } from 'bullmq';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, redisClient, redisConnection } from './config/redis';
import { createSocketServer, setSocketServer } from './config/socket';
import { logger } from './core/utils/logger';
import { registerNotificationSubscribers } from './modules/notifications/notification.subscribers';
import { registerDashboardCacheInvalidation } from './modules/dashboard/dashboard.cache-invalidation';
import { registerRiskCacheInvalidation } from './modules/risk/risk.cache-invalidation';
import { startNotificationWorker } from './modules/notifications/notification.processor';
import { startReminderScheduler } from './core/scheduler/scheduler';
import { startOcrWorker } from './modules/documents/document.ocr.processor';
import { startSearchIndexWorker } from './modules/contracts/search-index.processor';
import { ensureSearchIndex } from './modules/contracts/contract-search.service';
import { isSearchConfigured } from './core/search/es-client';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  await connectRedis();

  const app = createApp();
  const httpServer = http.createServer(app);
  const io = createSocketServer(httpServer);
  setSocketServer(io);

  registerNotificationSubscribers();
  registerDashboardCacheInvalidation();
  registerRiskCacheInvalidation();

  if (isSearchConfigured()) {
    await ensureSearchIndex();
  } else {
    logger.info('ELASTICSEARCH_URL not set — contract search will use the MongoDB text index fallback');
  }

  const workers: Worker[] = [];
  if (env.ENABLE_WORKERS) {
    workers.push(startNotificationWorker());
    workers.push(await startReminderScheduler());
    workers.push(startOcrWorker());
    if (isSearchConfigured()) workers.push(startSearchIndexWorker());
  } else {
    logger.info('ENABLE_WORKERS=false — this instance will not run background workers');
  }

  httpServer.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${env.PORT} is already in use — exiting. Stop whatever else is bound to it, or change PORT in .env`, {
        port: env.PORT,
      });
    } else {
      logger.error('Fatal error starting the HTTP server, exiting', { error: err.message, code: err.code });
    }
    process.exit(1);
  });

  httpServer.listen(env.PORT, () => {
    logger.info(`CLM API listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  registerGracefulShutdown(httpServer, io, workers);
}

function registerGracefulShutdown(httpServer: http.Server, io: SocketIOServer, workers: Worker[]): void {
  let shuttingDown = false;

  async function shutdown(signal: string): Promise<void> {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received — starting graceful shutdown`);

    const forceExitTimer = setTimeout(() => {
      logger.error('Graceful shutdown timed out after 25s — forcing exit');
      process.exit(1);
    }, 25_000);
    forceExitTimer.unref();

    try {
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
      logger.info('HTTP server closed (no longer accepting new connections)');

      io.close();

      await Promise.all(workers.map((worker) => worker.close()));
      logger.info('Background workers stopped');

      await disconnectDatabase();
      redisClient.disconnect();
      redisConnection.disconnect();
      logger.info('Database and Redis connections closed');

      clearTimeout(forceExitTimer);
      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error('Error during graceful shutdown — forcing exit', { error: err instanceof Error ? err.message : err });
      process.exit(1);
    }
  }

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

process.on('uncaughtException', (err) => {
  
  
  
  logger.error('Uncaught exception — terminating process for a clean restart', {
    error: err.message,
    stack: err.stack,
  });
  process.exitCode = 1;
  setImmediate(() => process.exit(1));
});

process.on('unhandledRejection', (reason) => {
  
  
  
  logger.error('Unhandled promise rejection — terminating process for a clean restart', { reason });
  process.exitCode = 1;
  setImmediate(() => process.exit(1));
});

bootstrap().catch((err) => {
  
  
  logger.error('Fatal error during bootstrap, exiting', { error: err.message });
  process.exit(1);
});
