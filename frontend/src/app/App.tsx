import { useSessionBootstrap } from '../features/auth/useSessionBootstrap';
import { useAppSelector } from '../shared/hooks/redux';
import { selectAuthStatus } from '../features/auth/authSlice';
import { AppRoutes } from '../routes/routes.config';

export default function App() {
  useSessionBootstrap();
  const status = useAppSelector(selectAuthStatus);

  if (status === 'idle' || status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center gap-2 bg-slate-50 dark:bg-ink-950 text-slate-500 dark:text-slate-400 text-sm transition-colors">
        <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-brass-500 animate-spin dark:border-ink-700 dark:border-t-brass-400" />
        Loading…
      </div>
    );
  }

  return <AppRoutes />;
}
