import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient } from '../../../shared/lib/axiosClient';
import { useAppDispatch } from '../../../shared/hooks/redux';
import { notificationsLoaded, notificationMarkedRead, allNotificationsMarkedRead } from '../notificationSlice';
import type { AppNotification } from '../types';

interface ListResponse {
  data: AppNotification[];
  meta: { unreadCount: number };
}

export function useLoadNotifications() {
  const dispatch = useAppDispatch();
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await axiosClient.get<ListResponse>('/notifications');
      dispatch(notificationsLoaded({ items: res.data.data, unreadCount: res.data.meta.unreadCount }));
      return res.data;
    },
    staleTime: Infinity, 
  });
}

export function useMarkNotificationRead() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: async (id: string) => {
      await axiosClient.patch(`/notifications/${id}/read`);
      return id;
    },
    onSuccess: (id) => dispatch(notificationMarkedRead(id)),
  });
}

export function useMarkAllNotificationsRead() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await axiosClient.patch('/notifications/read-all');
    },
    onSuccess: () => {
      dispatch(allNotificationsMarkedRead());
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
