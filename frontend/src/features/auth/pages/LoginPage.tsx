import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Mail, Lock, AlertCircle } from 'lucide-react';
import { useLogin } from '../api/authApi';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { AuthShell } from '../components/AuthShell';
import { EMAIL_VALIDATION } from '../../../shared/lib/validation';

interface LoginFormValues {
  tenantSlug: string;
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>();

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => navigate('/dashboard', { replace: true }),
    });
  });

  return (
    <AuthShell title="Sign in" subtitle="Welcome back — enter your details to continue.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-tenant-slug" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Organization
          </label>
          <div className="relative">
            <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <Input
              id="login-tenant-slug"
              type="text"
              placeholder="e.g. acme"
              autoComplete="organization"
              className="pl-9"
              {...register('tenantSlug', { required: 'Organization is required' })}
            />
          </div>
          {errors.tenantSlug && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.tenantSlug.message}</p>}
        </div>

        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              className="pl-9"
              {...register('email', { required: 'Email is required', ...EMAIL_VALIDATION })}
            />
          </div>
          {errors.email && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Link to="/forgot-password" className="text-xs text-brass-600 dark:text-brass-300 hover:text-brass-700 dark:hover:text-brass-200 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className="pl-9"
              {...register('password', { required: 'Password is required' })}
            />
          </div>
          {errors.password && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.password.message}</p>}
        </div>

        {login.isError && (
          <p className="flex items-center gap-2 text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-600/15 border border-danger-100 dark:border-danger-600/30 rounded-lg px-3 py-2 animate-fade-in">
            <AlertCircle size={15} className="shrink-0" />
            Invalid organization, email, or password.
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={login.isPending}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <p className="text-sm text-slate-500 dark:text-slate-400 mt-6 text-center">
        New organization?{' '}
        <Link to="/register" className="text-brass-600 dark:text-brass-300 hover:text-brass-700 dark:hover:text-brass-200 hover:underline font-medium">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}
