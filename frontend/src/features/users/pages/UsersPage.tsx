import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { UserPlus, Users, Pencil, Power } from 'lucide-react';
import { useUsers, useUpdateUser, useCreateTeammate } from '../api/userAdminApi';
import { useBusinessUnits, useDepartments } from '../../org-structure/api/orgStructureApi';
import { useAppSelector } from '../../../shared/hooks/redux';
import { selectCurrentUser } from '../../auth/authSlice';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { Badge } from '../../../shared/components/ui/Badge';
import { Card } from '../../../shared/components/ui/Card';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { SectionHeading } from '../../../shared/components/ui/SectionHeading';
import { TableContainer } from '../../../shared/components/ui/TableContainer';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { getApiErrorMessage } from '../../../shared/lib/apiError';
import { useToast } from '../../../shared/hooks/useToast';
import { EMAIL_VALIDATION } from '../../../shared/lib/validation';
import type { AdminUserProfile, UserRole } from '../types';
import { humanizeLabel } from '../../../shared/lib/display';

const ROLES: UserRole[] = ['Admin', 'LegalOfficer', 'FinanceOfficer', 'Executive', 'DepartmentUser', 'Vendor'];

interface CreateFormValues {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

function unitName(value: AdminUserProfile['businessUnit']): string {
  if (!value) return '—';
  return typeof value === 'string' ? value : value.name;
}

export default function UsersPage() {
  const currentUser = useAppSelector(selectCurrentUser);
  const { data: users, isLoading } = useUsers();
  const createTeammate = useCreateTeammate();
  const { showToast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateFormValues>();

  const onCreate = handleSubmit((values) => {
    setFormError(null);
    createTeammate.mutate(values, {
      onSuccess: () => {
        showToast('Teammate invited');
        reset();
      },
      onError: (err) => setFormError(getApiErrorMessage(err)),
    });
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description="Everyone with access to your organization's workspace, and what they're allowed to do in it."
      />

      <Card elevated className="p-6 mb-6 space-y-4 animate-fade-in-up">
        <SectionHeading icon={UserPlus} title="Add teammate" />
        <form onSubmit={onCreate} className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="user-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
            <Input id="user-name" {...register('name', { required: 'Required' })} />
            {errors.name && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="user-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <Input id="user-email" type="email" {...register('email', { required: 'Required', ...EMAIL_VALIDATION })} />
            {errors.email && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="user-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Temporary password</label>
            <Input
              id="user-password"
              type="password"
              {...register('password', { required: 'Required', minLength: { value: 10, message: 'At least 10 characters' } })}
            />
            {errors.password && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label htmlFor="user-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
            <Select id="user-role" {...register('role', { required: true })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
          </div>
        </div>
        {formError && <p className="text-sm text-danger-600 dark:text-danger-400">{formError}</p>}
        <Button type="submit" loading={createTeammate.isPending}>
          {createTeammate.isPending ? 'Adding…' : 'Add teammate'}
        </Button>
        </form>
      </Card>

      <Card className="animate-fade-in-up">
        {rowError && <p className="text-sm text-danger-600 dark:text-danger-400 px-4 pt-4">{rowError}</p>}
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : !users?.length ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center animate-fade-in">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
              <Users size={22} />
            </span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No users yet</p>
          </div>
        ) : (
          <TableContainer className="p-3 sm:p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-ink-800 text-left text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Business Unit</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isSelf={user.id === currentUser?.id}
                  isEditing={editingId === user.id}
                  onEditStart={() => setEditingId(user.id)}
                  onEditEnd={() => setEditingId(null)}
                  onError={setRowError}
                />
              ))}
            </tbody>
          </table>
          </TableContainer>
        )}
      </Card>
    </div>
  );
}

function UserRow({
  user,
  isSelf,
  isEditing,
  onEditStart,
  onEditEnd,
  onError,
}: {
  user: AdminUserProfile;
  isSelf: boolean;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onError: (msg: string | null) => void;
}) {
  const updateUser = useUpdateUser(user.id);
  const { showToast } = useToast();
  const { data: businessUnits } = useBusinessUnits();
  const businessUnitId = typeof user.businessUnit === 'string' ? user.businessUnit : user.businessUnit?._id ?? '';
  const { data: departments } = useDepartments(businessUnitId || undefined);

  const [role, setRole] = useState<UserRole>(user.role);
  const [businessUnit, setBusinessUnit] = useState(businessUnitId);
  const [department, setDepartment] = useState(
    typeof user.department === 'string' ? user.department : user.department?._id ?? ''
  );

  const save = () => {
    onError(null);
    updateUser.mutate(
      { role, businessUnit: businessUnit || null, department: department || null },
      {
        onSuccess: () => {
          showToast('User updated');
          onEditEnd();
        },
        onError: (err) => onError(getApiErrorMessage(err)),
      }
    );
  };

  const toggleActive = () => {
    onError(null);
    updateUser.mutate(
      { isActive: !user.isActive },
      {
        onSuccess: () => showToast(user.isActive ? 'User deactivated' : 'User reactivated'),
        onError: (err) => onError(getApiErrorMessage(err)),
      }
    );
  };

  if (isEditing) {
    return (
      <tr className="border-b border-slate-100 dark:border-ink-800">
        <td className="px-4 py-2 text-slate-900 dark:text-white">{user.name}<br /><span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span></td>
        <td className="px-4 py-2">
          <select className="rounded-lg border border-slate-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-sm transition-colors focus:outline-none focus:border-brass-500 dark:focus:border-brass-400 focus:ring-2 focus:ring-brass-500/20 dark:focus:ring-brass-400/20" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </td>
        <td className="px-4 py-2">
          <div className="flex flex-col gap-1">
            <select
              className="rounded-lg border border-slate-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-sm transition-colors focus:outline-none focus:border-brass-500 dark:focus:border-brass-400 focus:ring-2 focus:ring-brass-500/20 dark:focus:ring-brass-400/20"
              value={businessUnit}
              onChange={(e) => { setBusinessUnit(e.target.value); setDepartment(''); }}
            >
              <option value="">No business unit</option>
              {businessUnits?.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-sm transition-colors focus:outline-none focus:border-brass-500 dark:focus:border-brass-400 focus:ring-2 focus:ring-brass-500/20 dark:focus:ring-brass-400/20"
              value={department}
              disabled={!businessUnit}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">No department</option>
              {departments?.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
        </td>
        <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{user.isActive ? 'Active' : 'Inactive'}</td>
        <td className="px-4 py-2">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={save} disabled={updateUser.isPending}>Save</Button>
            <Button variant="secondary" onClick={onEditEnd}>Cancel</Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-100 dark:border-ink-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
      <td className="px-4 py-2.5 text-slate-900 dark:text-white">
        {user.name}{isSelf && <span className="text-xs text-slate-400 dark:text-slate-500"> (you)</span>}
        <br /><span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
      </td>
      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{humanizeLabel(user.role)}</td>
      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{unitName(user.businessUnit)}</td>
      <td className="px-4 py-2.5">
        <Badge tone={user.isActive ? 'success' : 'neutral'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
      </td>
      <td className="px-4 py-2.5">
        <div className="flex gap-1">
          <button
            onClick={onEditStart}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-ink-900 transition-colors dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Pencil size={12} />
            Edit
          </button>
          <button
            onClick={toggleActive}
            disabled={isSelf && user.isActive || updateUser.isPending}
            title={isSelf && user.isActive ? "You can't deactivate your own account" : undefined}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-danger-600 hover:bg-danger-50 transition-colors dark:text-danger-400 dark:hover:bg-danger-600/15 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Power size={12} />
            {user.isActive ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      </td>
    </tr>
  );
}
