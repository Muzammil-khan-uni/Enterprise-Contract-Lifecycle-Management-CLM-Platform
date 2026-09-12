import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
  leaving: boolean;
}

interface ToastContextValue {
  
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;

const EXIT_DURATION_MS = 200;

const TONE_CONFIG: Record<ToastTone, { icon: typeof CheckCircle2; iconClass: string; barClass: string }> = {
  success: { icon: CheckCircle2, iconClass: 'text-success-600 dark:text-success-400', barClass: 'bg-success-500' },
  error: { icon: XCircle, iconClass: 'text-danger-600 dark:text-danger-400', barClass: 'bg-danger-500' },
  info: { icon: Info, iconClass: 'text-info-600 dark:text-info-400', barClass: 'bg-info-500' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_DURATION_MS);
  }, []);

  const showToast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = ++nextId.current;
      setToasts((prev) => [...prev, { id, tone, message, leaving: false }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 w-[calc(100vw-2rem)] max-w-sm"
        aria-live="polite"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const { icon: Icon, iconClass, barClass } = TONE_CONFIG[t.tone];
          return (
            <div
              key={t.id}
              role="status"
              className={`relative overflow-hidden flex items-start gap-2.5 rounded-lg bg-white dark:bg-ink-900 shadow-elevated dark:shadow-elevated-dark border border-slate-200 dark:border-ink-800 p-3 pl-4 transition-all duration-200 ease-out ${
                t.leaving ? 'opacity-0 translate-x-3' : 'opacity-100 translate-x-0 animate-fade-in-up'
              }`}
            >
              <span className={`absolute left-0 top-0 bottom-0 w-1 ${barClass}`} aria-hidden="true" />
              <Icon size={17} className={`shrink-0 mt-0.5 ${iconClass}`} />
              <p className="text-sm text-slate-700 dark:text-slate-200 flex-1 min-w-0">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-white/10 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  
  
  
  
  if (!ctx) return { showToast: () => {} };
  return ctx;
}
