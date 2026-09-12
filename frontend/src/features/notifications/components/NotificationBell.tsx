import { useEffect, useState } from 'react';
import { Bell, CheckCheck, BellOff } from 'lucide-react';
import { useAppSelector } from '../../../shared/hooks/redux';
import { selectNotifications, selectUnreadCount } from '../notificationSlice';
import { useMarkNotificationRead, useMarkAllNotificationsRead } from '../api/notificationApi';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  
  
  
  
  
  
  
  
  const [visible, setVisible] = useState(false);
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const close = () => {
    setVisible(false);
    
    setTimeout(() => setOpen(false), 180);
  };

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  
  
  
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={() => (open ? close() : setOpen(true))}
        className="relative p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
        aria-label="Notifications"
      >
        <Bell size={18} className={unreadCount > 0 ? 'animate-[wiggle_0.4s_ease-in-out]' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger-400 opacity-60" />
            <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-danger-600 text-[10px] text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} aria-hidden="true" />
          <div
            className={`absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-80 sm:w-80 bg-white rounded-xl border border-slate-200 shadow-elevated z-20 origin-top-right transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] dark:bg-ink-900 dark:border-ink-800 dark:shadow-elevated-dark ${
              visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-ink-800">
              <span className="text-sm font-medium text-slate-900 dark:text-white">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="inline-flex items-center gap-1 text-xs text-brass-600 hover:text-brass-700 hover:underline dark:text-brass-300 dark:hover:text-brass-200"
                >
                  <CheckCheck size={13} />
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
                    <BellOff size={18} />
                  </span>
                  <p className="text-sm text-slate-500 dark:text-slate-400">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => !n.read && markRead.mutate(n.id)}
                    className={`relative w-full text-left px-4 py-3 pl-6 border-b border-slate-50 hover:bg-slate-50 transition-colors dark:border-ink-800/60 dark:hover:bg-white/5 ${
                      n.read ? 'opacity-60' : ''
                    }`}
                  >
                    {!n.read && (
                      <span className="absolute left-2.5 top-4 h-1.5 w-1.5 rounded-full bg-brass-500" aria-hidden="true" />
                    )}
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{n.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{timeAgo(n.createdAt)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
