import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useBodyScrollLock } from './useBodyScrollLock';
import { useFocusTrap } from './useFocusTrap';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  
  tone?: 'danger' | 'neutral';
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

interface ConfirmContextValue {
  
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  
  
  
  
  
  
  
  const [visible, setVisible] = useState(false);

  const settle = useCallback((value: boolean) => {
    setVisible(false);
    
    setTimeout(() => {
      setPending((current) => {
        current?.resolve(value);
        return null;
      });
    }, 180);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  useEffect(() => {
    if (!pending) return;
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [pending]);

  
  
  
  
  useEffect(() => {
    if (!pending) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') settle(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pending, settle]);

  
  
  
  useBodyScrollLock(!!pending);

  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, !!pending);

  const tone = pending?.tone ?? 'danger';
  const Icon = tone === 'danger' ? AlertTriangle : HelpCircle;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {pending && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="presentation">
          <div
            className={`absolute inset-0 bg-ink-950/60 backdrop-blur-sm transition-[opacity_180ms_cubic-bezier(0.16,1,0.3,1)] ${visible ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => settle(false)}
            aria-hidden="true"
          />
          <div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            className={`relative w-full max-w-sm rounded-xl bg-white dark:bg-ink-900 shadow-ambient dark:shadow-ambient-dark border border-slate-200 dark:border-ink-800 p-5 transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
              visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  tone === 'danger'
                    ? 'bg-danger-50 text-danger-600 dark:bg-danger-600/15 dark:text-danger-400'
                    : 'bg-brass-50 text-brass-600 dark:bg-brass-500/15 dark:text-brass-300'
                }`}
              >
                <Icon size={19} />
              </span>
              <div className="min-w-0 pt-1">
                <h2 id="confirm-dialog-title" className="font-display text-base font-semibold text-ink-950 dark:text-white">
                  {pending.title}
                </h2>
                <p id="confirm-dialog-message" className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {pending.message}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="secondary" size="sm" autoFocus onClick={() => settle(false)}>
                {pending.cancelLabel ?? 'Cancel'}
              </Button>
              <Button variant={tone === 'danger' ? 'danger' : 'primary'} size="sm" onClick={() => settle(true)}>
                {pending.confirmLabel ?? 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue['confirm'] {
  const ctx = useContext(ConfirmContext);
  
  
  
  
  
  if (!ctx) return (options: ConfirmOptions) => Promise.resolve(window.confirm(`${options.title}\n\n${options.message}`));
  return ctx.confirm;
}
