import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import { env } from './env';
import { redisClient } from './redis';
import { logger } from '../core/utils/logger';
import { JwtAccessPayload } from '../modules/users/user.types';

export function createSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  });

  const pubClient = redisClient.duplicate();
  const subClient = redisClient.duplicate();
  
  
  
  
  
  
  pubClient.on('error', (err) => logger.error('Socket.IO Redis pub client error', { error: err.message }));
  subClient.on('error', (err) => logger.error('Socket.IO Redis sub client error', { error: err.message }));
  io.adapter(createAdapter(pubClient, subClient));

  

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error('Missing auth token'));
      return;
    }
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
      socket.data.userId = payload.sub;
      socket.data.tenantId = payload.tenant;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    const tenantId = socket.data.tenantId as string;
    socket.join(`user:${userId}`);
    socket.join(`tenant:${tenantId}`);
    logger.debug('Socket connected', { userId, tenantId, socketId: socket.id });

    
    
    
    socket.on('error', (err) => {
      logger.error('Socket error', { userId, socketId: socket.id, error: err.message });
    });

    socket.on('disconnect', () => {
      logger.debug('Socket disconnected', { userId, socketId: socket.id });
    });
  });

  return io;
}

let ioInstance: SocketIOServer | null = null;
export function setSocketServer(io: SocketIOServer): void {
  ioInstance = io;
}
export function getSocketServer(): SocketIOServer | null {
  return ioInstance;
}
