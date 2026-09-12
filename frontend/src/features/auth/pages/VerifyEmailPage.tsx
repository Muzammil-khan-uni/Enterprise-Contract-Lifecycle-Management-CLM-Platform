import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, MailCheck, MailX } from 'lucide-react';
import { useVerifyEmail } from '../api/authApi';
import { Button } from '../../../shared/components/ui/Button';
import { AuthShell } from '../components/AuthShell';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const verifyEmail = useVerifyEmail();
  const attempted = useRef(false);
  const [asyncStatus, setAsyncStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;
    verifyEmail.mutate(
      { token },
      {
        onSuccess: () => setAsyncStatus('success'),
        onError: () => setAsyncStatus('error'),
      }
    );
    
  }, [token]);

  const status = token ? asyncStatus : 'error';

  if (status === 'verifying') {
    return (
      <AuthShell title="Verifying your email">
        <div className="flex flex-col items-center text-center gap-3 animate-fade-in-up">
          <Loader2 size={26} className="text-brass-500 dark:text-brass-400 animate-spin" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Just a moment…</p>
        </div>
      </AuthShell>
    );
  }

  if (status === 'success') {
    return (
      <AuthShell title="Email verified">
        <div className="flex flex-col items-center text-center gap-3 animate-fade-in-up">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success-50 dark:bg-success-600/15 text-success-600 dark:text-success-300">
            <MailCheck size={22} />
          </span>
          <p className="text-sm text-slate-600 dark:text-slate-400">Your email has been verified.</p>
        </div>
        <Link to="/login" className="block mt-4">
          <Button className="w-full">Sign in</Button>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Verification failed">
      <div className="flex flex-col items-center text-center gap-3 animate-fade-in-up">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-50 dark:bg-danger-600/15 text-danger-600 dark:text-danger-300">
          <MailX size={22} />
        </span>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          This link is invalid or has expired. If you're signed in, you can request a new one from your account.
        </p>
      </div>
      <Link to="/login" className="text-sm text-brass-600 dark:text-brass-300 hover:text-brass-700 dark:hover:text-brass-200 hover:underline mt-4 block text-center">
        ← Back to sign in
      </Link>
    </AuthShell>
  );
}
