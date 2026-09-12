import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { BookText, ScrollText } from 'lucide-react';
import { useClauses, useCreateClause, useUpdateClause, useDeleteClause } from '../api/templateApi';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Badge } from '../../../shared/components/ui/Badge';
import { Card } from '../../../shared/components/ui/Card';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { SectionHeading } from '../../../shared/components/ui/SectionHeading';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { getApiErrorMessage } from '../../../shared/lib/apiError';
import { useToast } from '../../../shared/hooks/useToast';
import { useConfirm } from '../../../shared/hooks/useConfirm';
import type { Clause } from '../types';
import { humanizeLabel } from '../../../shared/lib/display';

interface CreateFormValues {
  title: string;
  category: string;
  text: string;
  isMandatory: boolean;
  applicableContractTypes: string;
}

export default function ClauseLibraryPage() {
  const [categoryFilter, setCategoryFilter] = useState('');
  const { data: clauses, isLoading } = useClauses(categoryFilter || undefined);
  const createClause = useCreateClause();
  const { showToast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateFormValues>();

  const onCreate = handleSubmit((values) => {
    setFormError(null);
    createClause.mutate(
      {
        title: values.title,
        category: values.category,
        text: values.text,
        isMandatory: values.isMandatory,
        applicableContractTypes: values.applicableContractTypes
          ? values.applicableContractTypes.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      },
      {
        onSuccess: () => {
          showToast('Clause created');
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
        title="Clause Library"
        description="Reusable clause text templates assemble into sections. Use {{variableName}} for author-filled placeholders."
      />

      <Card elevated className="p-6 mb-6 space-y-4 animate-fade-in-up">
        <SectionHeading icon={BookText} title="Add clause" />
        <form onSubmit={onCreate} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="clause-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
            <Input id="clause-title" {...register('title', { required: 'Required' })} />
            {errors.title && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label htmlFor="clause-category" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
            <Input id="clause-category" {...register('category', { required: 'Required' })} placeholder="e.g. Confidentiality" />
            {errors.category && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.category.message}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="clause-text" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Clause text <span className="text-slate-400 dark:text-slate-500 font-normal">— use {'{{variableName}}'} for placeholders</span>
          </label>
          <textarea
            id="clause-text"
            className="w-full rounded-lg border border-slate-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm min-h-[100px] transition-colors focus:outline-none focus:border-brass-500 dark:focus:border-brass-400 focus:ring-2 focus:ring-brass-500/20 dark:focus:ring-brass-400/20"
            {...register('text', { required: 'Required' })}
          />
          {errors.text && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.text.message}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:items-end">
          <div>
            <label htmlFor="clause-applicable-types" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Applicable contract types (comma separated)</label>
            <Input id="clause-applicable-types" {...register('applicableContractTypes')} placeholder="Vendor, Service" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" {...register('isMandatory')} />
            Mandatory clause
          </label>
        </div>
        {formError && <p className="text-sm text-danger-600 dark:text-danger-400">{formError}</p>}
        <Button type="submit" loading={createClause.isPending}>
          {createClause.isPending ? 'Adding…' : 'Add clause'}
        </Button>
        </form>
      </Card>

      <div className="flex items-center gap-3 mb-4">
        <label htmlFor="clause-category-filter" className="text-sm text-slate-700 dark:text-slate-300">Filter by category</label>
        <Input
          id="clause-category-filter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="max-w-[220px]"
          placeholder="All categories"
        />
      </div>

      <Card className="animate-fade-in-up">
        {rowError && <p className="text-sm text-danger-600 dark:text-danger-400 px-4 pt-4">{rowError}</p>}
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : !clauses?.length ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center animate-fade-in">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
              <ScrollText size={22} />
            </span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No clauses yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-ink-800">
            {clauses.map((clause) => (
              <ClauseRow
                key={clause._id}
                clause={clause}
                isEditing={editingId === clause._id}
                onEditStart={() => setEditingId(clause._id)}
                onEditEnd={() => setEditingId(null)}
                onError={setRowError}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function ClauseRow({
  clause,
  isEditing,
  onEditStart,
  onEditEnd,
  onError,
}: {
  clause: Clause;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onError: (msg: string | null) => void;
}) {
  const updateClause = useUpdateClause(clause._id);
  const deleteClause = useDeleteClause();
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [title, setTitle] = useState(clause.title);
  const [text, setText] = useState(clause.text);

  const save = () => {
    onError(null);
    updateClause.mutate(
      { title, text },
      {
        onSuccess: () => {
          showToast('Clause updated');
          onEditEnd();
        },
        onError: (err) => onError(getApiErrorMessage(err)),
      }
    );
  };

  const remove = async () => {
    onError(null);
    const ok = await confirm({
      title: 'Delete clause?',
      message: `"${clause.title}" will be permanently removed. This can't be undone.`,
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    deleteClause.mutate(clause._id, {
      onSuccess: () => showToast('Clause deleted'),
      onError: (err) => onError(getApiErrorMessage(err)),
    });
  };

  if (isEditing) {
    return (
      <div className="px-4 py-4 space-y-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea
          className="w-full rounded-lg border border-slate-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm min-h-[80px] transition-colors focus:outline-none focus:border-brass-500 dark:focus:border-brass-400 focus:ring-2 focus:ring-brass-500/20 dark:focus:ring-brass-400/20"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={save} loading={updateClause.isPending}>Save</Button>
          <Button variant="secondary" onClick={onEditEnd}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 flex items-start justify-between gap-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-slate-900 dark:text-white">{clause.title}</span>
          <Badge tone="info">{humanizeLabel(clause.category)}</Badge>
          {clause.isMandatory && <Badge tone="warning">Mandatory</Badge>}
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{clause.text}</p>
        {clause.applicableContractTypes.length > 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Applies to: {clause.applicableContractTypes.join(', ')}</p>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          onClick={onEditStart}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-ink-900 transition-colors dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          Edit
        </button>
        <button
          onClick={remove}
          disabled={deleteClause.isPending}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-danger-600 hover:bg-danger-50 transition-colors dark:text-danger-400 dark:hover:bg-danger-600/15 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
