import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Network, Building2, Pencil, Trash2 } from 'lucide-react';
import {
  useBusinessUnits,
  useCreateBusinessUnit,
  useUpdateBusinessUnit,
  useDeleteBusinessUnit,
} from '../api/orgStructureApi';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { Card } from '../../../shared/components/ui/Card';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { SectionHeading } from '../../../shared/components/ui/SectionHeading';
import { TableContainer } from '../../../shared/components/ui/TableContainer';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { getApiErrorMessage } from '../../../shared/lib/apiError';
import { useToast } from '../../../shared/hooks/useToast';
import { useConfirm } from '../../../shared/hooks/useConfirm';
import type { BusinessUnit } from '../types';

interface FormValues {
  name: string;
  code: string;
  parentUnit: string;
}

function unitLabel(unit: BusinessUnit, allUnits: BusinessUnit[]): string {
  const parentId = typeof unit.parentUnit === 'string' ? unit.parentUnit : unit.parentUnit?._id;
  const parent = parentId ? allUnits.find((u) => u._id === parentId) : null;
  return parent ? `${unit.name} (${unit.code}) — under ${parent.name}` : `${unit.name} (${unit.code})`;
}

export default function BusinessUnitsPage() {
  const { data: units, isLoading } = useBusinessUnits();
  const createUnit = useCreateBusinessUnit();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  const onCreate = handleSubmit((values) => {
    setFormError(null);
    createUnit.mutate(
      { name: values.name, code: values.code.toUpperCase(), parentUnit: values.parentUnit || null },
      {
        onSuccess: () => {
          showToast('Business unit created');
          reset();
        },
        onError: (err) => setFormError(getApiErrorMessage(err)),
      }
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Administration"
        title="Business Units"
        description="Reference data used to organize contracts, departments, and users."
      />

      <Card elevated className="p-6 mb-6 space-y-4 animate-fade-in-up">
        <SectionHeading icon={Network} title="Add business unit" />
        <form onSubmit={onCreate} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="bu-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
            <Input id="bu-name" {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="bu-code" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Code</label>
            <Input id="bu-code" {...register('code', { required: 'Code is required' })} placeholder="e.g. ENG" />
            {errors.code && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.code.message}</p>}
          </div>
          <div>
            <label htmlFor="bu-parent-unit" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Parent unit (optional)</label>
            <Select id="bu-parent-unit" {...register('parentUnit')}>
              <option value="">None</option>
              {units?.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </Select>
          </div>
        </div>
        {formError && <p className="text-sm text-danger-600 dark:text-danger-400">{formError}</p>}
        <Button type="submit" loading={createUnit.isPending}>
          {createUnit.isPending ? 'Adding…' : 'Add business unit'}
        </Button>
        </form>
      </Card>

      <Card className="animate-fade-in-up">
        {deleteError && (
          <p className="text-sm text-danger-600 dark:text-danger-400 px-4 pt-4">{deleteError}</p>
        )}
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : !units?.length ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center animate-fade-in">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
              <Building2 size={22} />
            </span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No business units yet</p>
          </div>
        ) : (
          <TableContainer className="p-3 sm:p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-ink-800 text-left text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Business Unit</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {units.map((unit) => (
                <BusinessUnitRow
                  key={unit._id}
                  unit={unit}
                  allUnits={units}
                  isEditing={editingId === unit._id}
                  onEditStart={() => setEditingId(unit._id)}
                  onEditEnd={() => setEditingId(null)}
                  onDeleteError={setDeleteError}
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

function BusinessUnitRow({
  unit,
  allUnits,
  isEditing,
  onEditStart,
  onEditEnd,
  onDeleteError,
}: {
  unit: BusinessUnit;
  allUnits: BusinessUnit[];
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onDeleteError: (msg: string | null) => void;
}) {
  const updateUnit = useUpdateBusinessUnit(unit._id);
  const deleteUnit = useDeleteBusinessUnit();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [name, setName] = useState(unit.name);
  const [code, setCode] = useState(unit.code);

  const save = () => {
    updateUnit.mutate(
      { name, code: code.toUpperCase() },
      {
        onSuccess: () => {
          showToast('Business unit updated');
          onEditEnd();
        },
      }
    );
  };

  const remove = async () => {
    onDeleteError(null);
    const ok = await confirm({
      title: 'Delete business unit?',
      message: `"${unit.name}" will be permanently removed. This can't be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    deleteUnit.mutate(unit._id, {
      onSuccess: () => showToast('Business unit deleted'),
      onError: (err) => onDeleteError(getApiErrorMessage(err)),
    });
  };

  if (isEditing) {
    return (
      <tr className="border-b border-slate-100 dark:border-ink-800">
        <td className="px-4 py-2">
          <div className="flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-[160px]" />
            <Input value={code} onChange={(e) => setCode(e.target.value)} className="max-w-[100px]" />
          </div>
        </td>
        <td className="px-4 py-2">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={save} disabled={updateUnit.isPending}>Save</Button>
            <Button variant="secondary" onClick={onEditEnd}>Cancel</Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-100 dark:border-ink-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
      <td className="px-4 py-2.5 text-slate-900 dark:text-white">{unitLabel(unit, allUnits)}</td>
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
            onClick={remove}
            disabled={deleteUnit.isPending}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-danger-600 hover:bg-danger-50 transition-colors dark:text-danger-400 dark:hover:bg-danger-600/15 disabled:opacity-50"
          >
            <Trash2 size={12} />
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
