import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { sanitizeRequest } from './core/middleware/sanitize.middleware';
import { env } from './config/env';
import { globalRateLimiter } from './core/middleware/rate-limit.middleware';
import { errorHandlerMiddleware } from './core/errors/error-handler.middleware';
import { AppError } from './core/errors/AppError';
import apiRoutes from './routes/index';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(compression());
  app.use(
    express.json({
      limit: '2mb',
      
      
      
      
      
      
      
      
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  

  app.use(sanitizeRequest());

  app.use(globalRateLimiter);

  app.use(`/api/${env.API_VERSION}`, apiRoutes);

  
  app.use((_req, _res, next) => {
    next(AppError.notFound('Route not found'));
  });

  
  app.use(errorHandlerMiddleware);

  return app;
}
