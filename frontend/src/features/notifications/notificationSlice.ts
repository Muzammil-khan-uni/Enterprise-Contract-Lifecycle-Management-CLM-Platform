import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type { AppNotification } from './types';

interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    notificationsLoaded(state, action: PayloadAction<{ items: AppNotification[]; unreadCount: number }>) {
      state.items = action.payload.items;
      state.unreadCount = action.payload.unreadCount;
    },
    notificationReceived(state, action: PayloadAction<AppNotification>) {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
    notificationMarkedRead(state, action: PayloadAction<string>) {
      const item = state.items.find((n) => n.id === action.payload);
      if (item && !item.read) {
        item.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    allNotificationsMarkedRead(state) {
      state.items.forEach((n) => (n.read = true));
      state.unreadCount = 0;
    },
  },
});

export const { notificationsLoaded, notificationReceived, notificationMarkedRead, allNotificationsMarkedRead } =
  notificationSlice.actions;

export const selectNotifications = (state: RootState) => state.notifications.items;
export const selectUnreadCount = (state: RootState) => state.notifications.unreadCount;

export default notificationSlice.reducer;
