import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  User,
  Mail,
  ShieldCheck,
  Building2,
  Network,
  CalendarDays,
  KeyRound,
  Pencil,
  Check,
  X,
  Sun,
  Moon,
  Monitor,
  LogOut,
  ShieldAlert,
  BadgeCheck,
  Camera,
  Trash2,
  FileText,
} from 'lucide-react';
import { useAppSelector } from '../../../shared/hooks/redux';
import { selectCurrentUser } from '../../auth/authSlice';
import { useChangePassword, useLogoutAllSessions, useResendVerification } from '../../auth/api/authApi';
import { useUpdateOwnProfile, useUploadAvatar, useDeleteAvatar } from '../api/profileApi';
import { useBusinessUnits, useDepartments } from '../../org-structure/api/orgStructureApi';
import { useTheme } from '../../../shared/hooks/useTheme';
import { Avatar } from '../../../shared/components/ui/Avatar';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Textarea } from '../../../shared/components/ui/Textarea';
import { Badge } from '../../../shared/components/ui/Badge';
import { Card } from '../../../shared/components/ui/Card';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { SectionHeading } from '../../../shared/components/ui/SectionHeading';
import { getApiErrorMessage } from '../../../shared/lib/apiError';
import { useToast } from '../../../shared/hooks/useToast';

const ROLE_LABEL: Record<string, string> = {
  Admin: 'Administrator',
  LegalOfficer: 'Legal Officer',
  FinanceOfficer: 'Finance Officer',
  DepartmentUser: 'Department User',
  Executive: 'Executive',
};

const BIO_MAX_LENGTH = 500;

function AvatarPhotoControls({ hasPhoto, children }: { hasPhoto: boolean; children: React.ReactNode }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    uploadAvatar.mutate(file, {
      onSuccess: () => showToast('Profile photo updated'),
      onError: (err) => setError(getApiErrorMessage(err)),
      onSettled: () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  };

  return (
    <>
      <div className="relative inline-block">
        {children}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAvatar.isPending}
          aria-label={hasPhoto ? 'Change profile photo' : 'Upload profile photo'}
          title={hasPhoto ? 'Change profile photo' : 'Upload profile photo'}
          className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-white shadow-elevated ring-2 ring-white dark:bg-brass-500 dark:text-ink-950 dark:ring-ink-900 transition-transform hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
        >
          {uploadAvatar.isPending ? (
            <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : (
            <Camera size={14} />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
          className="sr-only"
        />
      </div>
      {hasPhoto && (
        <button
          type="button"
          onClick={() => {
            setError(null);
            deleteAvatar.mutate(undefined, {
              onSuccess: () => showToast('Profile photo removed'),
              onError: (err) => setError(getApiErrorMessage(err)),
            });
          }}
          disabled={deleteAvatar.isPending}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-danger-600 dark:text-slate-400 dark:hover:text-danger-400 transition-colors mt-2 disabled:opacity-60"
        >
          <Trash2 size={12} />
          {deleteAvatar.isPending ? 'Removing…' : 'Remove photo'}
        </button>
      )}
      {error && <p className="text-xs text-danger-600 dark:text-danger-400 mt-2 max-w-[200px] text-center">{error}</p>}
    </>
  );
}

function EditableNameForm({ name, onDone }: { name: string; onDone: () => void }) {
  const updateProfile = useUpdateOwnProfile();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string }>({ defaultValues: { name } });

  const onSubmit = handleSubmit((values) => {
    setError(null);
    updateProfile.mutate(values, {
      onSuccess: () => {
        showToast('Name updated');
        onDone();
      },
      onError: (err) => setError(getApiErrorMessage(err)),
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 animate-fade-in-up">
      <div className="flex-1 w-full">
        <Input {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Too short' } })} autoFocus />
        {errors.name && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.name.message}</p>}
        {error && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{error}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        <Button type="submit" size="sm" loading={updateProfile.isPending}>
          <Check size={14} />
          Save
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onDone}>
          <X size={14} />
          Cancel
        </Button>
      </div>
    </form>
  );
}

function EditableBioForm({ name, bio, onDone }: { name: string; bio: string | null; onDone: () => void }) {
  const updateProfile = useUpdateOwnProfile();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<{ bio: string }>({ defaultValues: { bio: bio ?? '' } });

  const bioValue = watch('bio') ?? '';

  const onSubmit = handleSubmit((values) => {
    setError(null);
    updateProfile.mutate(
      { name, bio: values.bio },
      {
        onSuccess: () => {
          showToast('About me updated');
          onDone();
        },
        onError: (err) => setError(getApiErrorMessage(err)),
      }
    );
  });

  return (
    <form onSubmit={onSubmit} className="animate-fade-in-up">
      <Textarea
        rows={4}
        placeholder="Tell your team a bit about yourself — your role, focus areas, or anything worth knowing."
        {...register('bio', { maxLength: { value: BIO_MAX_LENGTH, message: `Keep it under ${BIO_MAX_LENGTH} characters` } })}
        autoFocus
      />
      <div className="flex items-center justify-between mt-1">
        <div>
          {errors.bio && <p className="text-xs text-danger-600 dark:text-danger-400">{errors.bio.message}</p>}
          {error && <p className="text-xs text-danger-600 dark:text-danger-400">{error}</p>}
        </div>
        <p className={`text-xs shrink-0 ${bioValue.length > BIO_MAX_LENGTH ? 'text-danger-600 dark:text-danger-400' : 'text-slate-400 dark:text-slate-500'}`}>
          {bioValue.length}/{BIO_MAX_LENGTH}
        </p>
      </div>
      <div className="flex gap-2 mt-2">
        <Button type="submit" size="sm" loading={updateProfile.isPending}>
          <Check size={14} />
          Save
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onDone}>
          <X size={14} />
          Cancel
        </Button>
      </div>
    </form>
  );
}

function ChangePasswordForm() {
  const changePassword = useChangePassword();
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<{ currentPassword: string; newPassword: string; confirmPassword: string }>();

  const newPassword = watch('newPassword');

  const onSubmit = handleSubmit((values) => {
    setSuccess(false);
    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          setSuccess(true);
          reset();
        },
      }
    );
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="current-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Current password
        </label>
        <Input id="current-password" type="password" autoComplete="current-password" {...register('currentPassword', { required: 'Required' })} />
        {errors.currentPassword && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.currentPassword.message}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            New password
          </label>
          <Input id="new-password" type="password" autoComplete="new-password" {...register('newPassword', { required: 'Required' })} />
          {errors.newPassword && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.newPassword.message}</p>}
        </div>
        <div>
          <label htmlFor="confirm-new-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Confirm new password
          </label>
          <Input
            id="confirm-new-password"
            type="password"
            autoComplete="new-password"
            {...register('confirmPassword', {
              required: 'Required',
              validate: (v) => v === newPassword || "Passwords don't match",
            })}
          />
          {errors.confirmPassword && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.confirmPassword.message}</p>}
        </div>
      </div>

      {changePassword.isError && (
        <p className="flex items-center gap-2 text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-600/15 border border-danger-100 dark:border-danger-600/30 rounded-lg px-3 py-2 animate-fade-in">
          <ShieldAlert size={15} className="shrink-0" />
          {getApiErrorMessage(changePassword.error)}
        </p>
      )}
      {success && (
        <p className="flex items-center gap-2 text-sm text-success-700 dark:text-success-300 bg-success-50 dark:bg-success-600/15 border border-success-100 dark:border-success-600/30 rounded-lg px-3 py-2 animate-fade-in">
          <BadgeCheck size={15} className="shrink-0" />
          Password changed. Your other sessions have been signed out.
        </p>
      )}

      <Button type="submit" loading={changePassword.isPending}>
        <KeyRound size={15} />
        {changePassword.isPending ? 'Changing…' : 'Change password'}
      </Button>
    </form>
  );
}

function ThemePreference() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
  ];

  return (
    <div className="flex gap-2">
      {options.map(({ value, label, icon: Icon }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={`flex-1 flex flex-col items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'border-brass-400 bg-brass-50 text-brass-700 dark:bg-brass-500/15 dark:text-brass-200 dark:border-brass-500/40 shadow-card dark:shadow-card-dark'
                : 'border-slate-200 dark:border-ink-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-ink-700'
            }`}
          >
            <Icon size={18} className={isActive ? 'animate-fade-in' : ''} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function ProfilePage() {
  const user = useAppSelector(selectCurrentUser);
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const businessUnits = useBusinessUnits();
  const departments = useDepartments();
  const resendVerification = useResendVerification();
  const [verificationSent, setVerificationSent] = useState(false);
  const logoutAll = useLogoutAllSessions();
  const [loggedOutAll, setLoggedOutAll] = useState(false);

  if (!user) return null;

  const businessUnitName = businessUnits.data?.find((bu) => bu._id === user.businessUnit)?.name;
  const departmentName = departments.data?.find((d) => d._id === user.department)?.name;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader eyebrow="Account" title="My Profile" description="Manage your personal information, security, and preferences." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {}
        <Card elevated className="lg:col-span-1 h-fit lg:sticky lg:top-20 animate-fade-in-up overflow-hidden">
          {

}
          <div className="relative h-20 bg-ink-wash">
            <div className="absolute inset-0 bg-grid-ink opacity-[0.08]" aria-hidden="true" />
          </div>
          <div className="flex flex-col items-center text-center px-6 pb-6 -mt-10">
            <AvatarPhotoControls hasPhoto={!!user.avatarUrl}>
              <Avatar
                name={user.name}
                seed={user.id}
                size="xl"
                photoUrl={user.avatarUrl}
                className="shadow-glow-brass dark:shadow-glow-brass-dark"
              />
            </AvatarPhotoControls>
            <h2 className="font-display text-xl font-semibold text-ink-950 dark:text-white mt-3 truncate max-w-full">{user.name}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-full">{user.email}</p>
            <div className="mt-2.5">
              <Badge tone="brass">
                <ShieldCheck size={11} className="-ml-0.5 mr-1" />
                {ROLE_LABEL[user.role] ?? user.role}
              </Badge>
            </div>

            <div className="w-full border-t border-slate-100 dark:border-ink-800 mt-5 pt-5 space-y-3 text-left">
              <div className="flex items-center gap-2.5 text-sm">
                <Mail size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="text-slate-600 dark:text-slate-400 truncate flex-1">{user.email}</span>
                {user.emailVerified ? (
                  <span title="Verified" className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-success-50 dark:bg-success-600/15 text-success-600 dark:text-success-400">
                    <BadgeCheck size={13} />
                  </span>
                ) : (
                  <span className="shrink-0">
                    <Badge tone="warning">Unverified</Badge>
                  </span>
                )}
              </div>
              {businessUnitName && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Building2 size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400 truncate">{businessUnitName}</span>
                </div>
              )}
              {departmentName && (
                <div className="flex items-center gap-2.5 text-sm">
                  <Network size={15} className="text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400 truncate">{departmentName}</span>
                </div>
              )}
            </div>

            {!user.emailVerified && (
              <div className="w-full mt-4">
                {verificationSent ? (
                  <p className="text-xs text-success-600 dark:text-success-400">Verification email sent — check your inbox.</p>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    loading={resendVerification.isPending}
                    onClick={() => resendVerification.mutate(undefined, { onSuccess: () => setVerificationSent(true) })}
                  >
                    <Mail size={13} />
                    Resend verification email
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>

        {}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card className="p-5 animate-fade-in-up" style={{ animationDelay: '60ms', animationFillMode: 'backwards' }}>
            <SectionHeading icon={User} title="Personal information" />
            {editingName ? (
              <EditableNameForm name={user.name} onDone={() => setEditingName(false)} />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Full name</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">{user.name}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setEditingName(true)}>
                  <Pencil size={13} />
                  Edit
                </Button>
              </div>
            )}

            <div className="border-t border-slate-100 dark:border-ink-800 mt-4 pt-4">
              {editingBio ? (
                <EditableBioForm name={user.name} bio={user.bio} onDone={() => setEditingBio(false)} />
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <FileText size={11} />
                      About me
                    </p>
                    {user.bio ? (
                      <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">{user.bio}</p>
                    ) : (
                      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 italic">Add a short bio so your team knows a bit about you.</p>
                    )}
                  </div>
                  <Button variant="secondary" size="sm" className="shrink-0" onClick={() => setEditingBio(true)}>
                    <Pencil size={13} />
                    {user.bio ? 'Edit' : 'Add'}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5 animate-fade-in-up" style={{ animationDelay: '110ms', animationFillMode: 'backwards' }}>
            <SectionHeading icon={KeyRound} title="Security" description="Change your password or sign out of other devices." />
            <ChangePasswordForm />

            <div className="border-t border-slate-100 dark:border-ink-800 mt-5 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                  <LogOut size={15} />
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Active sessions</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Sign out everywhere except this device.</p>
                </div>
              </div>
              {loggedOutAll ? (
                <p className="text-xs text-success-600 dark:text-success-400 flex items-center gap-1.5 shrink-0">
                  <Check size={13} />
                  Done
                </p>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="shrink-0"
                  loading={logoutAll.isPending}
                  onClick={() => logoutAll.mutate(undefined, { onSuccess: () => setLoggedOutAll(true) })}
                >
                  <LogOut size={13} />
                  Sign out other devices
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-5 animate-fade-in-up" style={{ animationDelay: '160ms', animationFillMode: 'backwards' }}>
            <SectionHeading icon={Monitor} title="Appearance" description="Choose how CLM Platform looks on this device." />
            <ThemePreference />
          </Card>

          <Card className="p-5 animate-fade-in-up" style={{ animationDelay: '210ms', animationFillMode: 'backwards' }}>
            <SectionHeading icon={CalendarDays} title="Account" />
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 dark:border-ink-800 p-3.5 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brass-50 dark:bg-brass-500/15 text-brass-600 dark:text-brass-300">
                  <ShieldCheck size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Role</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{ROLE_LABEL[user.role] ?? user.role}</p>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 dark:border-ink-800 p-3.5 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-info-50 dark:bg-info-600/15 text-info-600 dark:text-info-300">
                  <KeyRound size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Permissions</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user.permissions.length} granted</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
