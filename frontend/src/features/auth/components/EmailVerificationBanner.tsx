import { useState } from 'react';
import { useAppSelector } from '../../../shared/hooks/redux';
import { selectCurrentUser } from '../authSlice';
import { useResendVerification } from '../api/authApi';

export function EmailVerificationBanner() {
  const user = useAppSelector(selectCurrentUser);
  const resend = useResendVerification();
  const [sent, setSent] = useState(false);

  if (!user || user.emailVerified) return null;

  return (
    <div className="bg-warning-50 border-b border-warning-100 px-4 sm:px-6 py-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 sm:justify-between text-sm animate-fade-in dark:bg-warning-600/10 dark:border-warning-600/20">
      <span className="text-warning-700 dark:text-warning-100">
        {sent ? 'Verification email sent — check your inbox.' : 'Please verify your email address.'}
      </span>
      {!sent && (
        <button
          onClick={() => resend.mutate(undefined, { onSuccess: () => setSent(true) })}
          disabled={resend.isPending}
          className="text-left sm:text-right text-warning-700 dark:text-warning-100 font-medium hover:underline disabled:opacity-50"
        >
          {resend.isPending ? 'Sending…' : 'Resend email'}
        </button>
      )}
    </div>
  );
}
