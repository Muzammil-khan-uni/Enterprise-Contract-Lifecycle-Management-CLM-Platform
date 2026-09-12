import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { selectAccessToken, selectIsAuthenticated } from '../../features/auth/authSlice';
import { notificationReceived } from '../../features/notifications/notificationSlice';
import { connectSocket, disconnectSocket, getSocket } from '../lib/socket';
import { queryClient } from '../lib/queryClient';
import { REALTIME_QUERY_MAP } from '../lib/realtimeQueryMap';
import type { AppNotification } from '../../features/notifications/types';

interface EntityChangeEvent {
  resource: string;
  action: 'created' | 'updated' | 'deleted';
  id: string;
}

export function useSocket(): void {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const accessToken = useAppSelector(selectAccessToken);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      disconnectSocket();
      return;
    }

    connectSocket(accessToken);
    const socket = getSocket();

    const handleNotification = (payload: AppNotification) => {
      dispatch(notificationReceived(payload));
    };
    socket.on('notification', handleNotification);

    const handleEntityChange = ({ resource }: EntityChangeEvent) => {
      const keys = REALTIME_QUERY_MAP[resource];
      if (!keys) return;
      for (const queryKey of keys) {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      }
    };
    socket.on('entity-change', handleEntityChange);

    return () => {
      socket.off('notification', handleNotification);
      socket.off('entity-change', handleEntityChange);
    };
  }, [isAuthenticated, accessToken, dispatch]);
}
