import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Lock, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { useResetPassword } from '../api/authApi';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { AuthShell } from '../components/AuthShell';

interface FormValues {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const resetPassword = useResetPassword();
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = handleSubmit((values) => {
    if (!token) return;
    if (values.newPassword !== values.confirmPassword) return;
    resetPassword.mutate(
      { token, newPassword: values.newPassword },
      { onSuccess: () => setDone(true) }
    );
  });

  if (!token) {
    return (
      <AuthShell title="Invalid link">
        <div className="flex flex-col items-center text-center gap-3 animate-fade-in-up">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-600/15 text-warning-600 dark:text-warning-300">
            <ShieldAlert size={22} />
          </span>
          <p className="text-sm text-slate-600 dark:text-slate-400">This page needs a reset token from a password reset email.</p>
        </div>
        <Link to="/forgot-password" className="text-sm text-brass-600 dark:text-brass-300 hover:text-brass-700 dark:hover:text-brass-200 hover:underline mt-4 block text-center">
          Request a new reset link
        </Link>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password reset">
        <div className="flex flex-col items-center text-center gap-3 animate-fade-in-up">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success-50 dark:bg-success-600/15 text-success-600 dark:text-success-300">
            <CheckCircle2 size={22} />
          </span>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your password has been changed, and any other signed-in sessions have been logged out.
          </p>
        </div>
        <Button onClick={() => navigate('/login', { replace: true })} className="w-full mt-4">Sign in</Button>
      </AuthShell>
    );
  }

  
  
  
  
  
  
  
  
  
  const passwordsMismatch = watch('confirmPassword') && watch('newPassword') !== watch('confirmPassword');

  return (
    <AuthShell title="Set a new password" subtitle="At least 10 characters, with an uppercase letter and a number.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="reset-new-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New password</label>
          <div className="relative">
            <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <Input id="reset-new-password" type="password" className="pl-9" {...register('newPassword', { required: 'A new password is required' })} />
          </div>
          {errors.newPassword && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.newPassword.message}</p>}
        </div>
        <div>
          <label htmlFor="reset-confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm password</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <Input id="reset-confirm-password" type="password" className="pl-9" {...register('confirmPassword', { required: 'Please confirm your password' })} />
          </div>
          {passwordsMismatch && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">Passwords don't match.</p>}
        </div>

        {resetPassword.isError && (
          <p className="flex items-center gap-2 text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-600/15 border border-danger-100 dark:border-danger-600/30 rounded-lg px-3 py-2 animate-fade-in">
            <AlertCircle size={15} className="shrink-0" />
            This reset link is invalid or has expired — request a new one.
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={resetPassword.isPending} disabled={!!passwordsMismatch}>
          {resetPassword.isPending ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>
    </AuthShell>
  );
}
