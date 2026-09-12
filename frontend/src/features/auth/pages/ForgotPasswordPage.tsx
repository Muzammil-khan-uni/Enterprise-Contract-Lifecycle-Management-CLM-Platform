import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { MailCheck, Building2, Mail, AlertCircle } from 'lucide-react';
import { useForgotPassword } from '../api/authApi';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { AuthShell } from '../components/AuthShell';
import { EMAIL_VALIDATION } from '../../../shared/lib/validation';

interface FormValues {
  tenantSlug: string;
  email: string;
}

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  const onSubmit = handleSubmit((values) => {
    forgotPassword.mutate(values, { onSuccess: () => setSubmitted(true) });
  });

  if (submitted) {
    return (
      <AuthShell title="Check your inbox">
        <div className="flex flex-col items-center text-center gap-3 animate-fade-in-up">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success-50 dark:bg-success-600/15 text-success-600 dark:text-success-300">
            <MailCheck size={22} />
          </span>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            If an account with that email exists in that organization, we've sent a password reset link to it.
          </p>
        </div>
        <Link to="/login" className="text-sm text-brass-600 dark:text-brass-300 hover:text-brass-700 dark:hover:text-brass-200 hover:underline mt-4 block text-center">
          ← Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset your password" subtitle="Enter your organization and email, and we'll send you a reset link.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="forgot-tenant-slug" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Organization</label>
          <div className="relative">
            <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <Input id="forgot-tenant-slug" placeholder="e.g. acme" className="pl-9" {...register('tenantSlug', { required: 'Organization is required' })} />
          </div>
          {errors.tenantSlug && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.tenantSlug.message}</p>}
        </div>
        <div>
          <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <Input id="forgot-email" type="email" className="pl-9" {...register('email', { required: 'Email is required', ...EMAIL_VALIDATION })} />
          </div>
          {errors.email && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.email.message}</p>}
        </div>

        {forgotPassword.isError && (
          <p className="flex items-center gap-2 text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-600/15 border border-danger-100 dark:border-danger-600/30 rounded-lg px-3 py-2 animate-fade-in">
            <AlertCircle size={15} className="shrink-0" />
            Something went wrong. Please try again.
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={forgotPassword.isPending}>
          {forgotPassword.isPending ? 'Sending…' : 'Send reset link'}
        </Button>
        <Link to="/login" className="text-sm text-brass-600 dark:text-brass-300 hover:text-brass-700 dark:hover:text-brass-200 hover:underline block text-center">
          ← Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}
