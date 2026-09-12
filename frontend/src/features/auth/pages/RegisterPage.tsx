import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, AlertCircle } from 'lucide-react';
import { useRegisterOrganization } from '../api/authApi';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { AuthShell } from '../components/AuthShell';
import { EMAIL_VALIDATION } from '../../../shared/lib/validation';
import { getApiErrorMessage } from '../../../shared/lib/apiError';

interface RegisterFormValues {
  tenantName: string;
  tenantSlug: string;
  name: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerOrg = useRegisterOrganization();
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormValues>();

  const deriveSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const onOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    
    
    
    const currentSlug = getValues('tenantSlug');
    const previousDerived = deriveSlug(e.target.value.slice(0, -1));
    if (!currentSlug || currentSlug === previousDerived) {
      setValue('tenantSlug', deriveSlug(e.target.value));
    }
  };

  const onSubmit = handleSubmit((values) => {
    registerOrg.mutate(
      { ...values, tenantSlug: deriveSlug(values.tenantSlug) },
      { onSuccess: () => navigate('/dashboard', { replace: true }) }
    );
  });

  return (
    <AuthShell title="Create your organization" subtitle="You'll be the first Admin.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="register-tenant-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Organization name
          </label>
          <div className="relative">
            <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <Input
              id="register-tenant-name"
              type="text"
              placeholder="e.g. Acme Corporation"
              className="pl-9"
              {...register('tenantName', { required: 'Organization name is required', onChange: onOrgNameChange })}
            />
          </div>
          {errors.tenantName && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.tenantName.message}</p>}
        </div>

        <div>
          <label htmlFor="register-tenant-slug" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Organization slug
          </label>
          <Input
            id="register-tenant-slug"
            type="text"
            placeholder="e.g. acme"
            {...register('tenantSlug', {
              required: 'Organization slug is required',
              pattern: { value: /^[a-z0-9-]+$/i, message: 'Letters, numbers, and hyphens only' },
            })}
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">This is what you and your teammates use to sign in.</p>
          {errors.tenantSlug && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.tenantSlug.message}</p>}
        </div>

        <div>
          <label htmlFor="register-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Your name
          </label>
          <Input id="register-name" type="text" {...register('name', { required: 'Your name is required' })} />
          {errors.name && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="register-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Email
          </label>
          <Input id="register-email" type="email" {...register('email', { required: 'Email is required', ...EMAIL_VALIDATION })} />
          {errors.email && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="register-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Password
          </label>
          <Input
            id="register-password"
            type="password"
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 10, message: 'At least 10 characters' },
              pattern: {
                value: /^(?=.*[A-Z])(?=.*[0-9])/,
                message: 'Must include an uppercase letter and a number',
              },
            })}
          />
          {errors.password && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.password.message}</p>}
        </div>

        {registerOrg.isError && (
          <p className="flex items-center gap-2 text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-600/15 border border-danger-100 dark:border-danger-600/30 rounded-lg px-3 py-2 animate-fade-in">
            <AlertCircle size={15} className="shrink-0" />
            {getApiErrorMessage(registerOrg.error)}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={registerOrg.isPending}>
          {registerOrg.isPending ? 'Creating organization…' : 'Create organization'}
        </Button>
      </form>

      <p className="text-sm text-slate-500 dark:text-slate-400 mt-6 text-center">
        Already have an organization?{' '}
        <Link to="/login" className="text-brass-600 dark:text-brass-300 hover:text-brass-700 dark:hover:text-brass-200 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
