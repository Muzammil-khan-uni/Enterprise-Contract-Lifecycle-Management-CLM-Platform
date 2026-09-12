import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, { autoConnect: false });
  }
  return socket;
}

export function connectSocket(accessToken: string): void {
  const s = getSocket();
  s.auth = { token: accessToken };
  if (!s.connected) s.connect();
}

export function disconnectSocket(): void {
  const s = getSocket();
  if (s.connected) s.disconnect();
}
