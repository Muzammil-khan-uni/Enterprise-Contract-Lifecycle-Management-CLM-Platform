import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { ChevronDown, LayoutTemplate, FileStack } from 'lucide-react';
import { useAdminTemplates, useCreateTemplate, useUpdateTemplate } from '../api/templateApi';
import { useClauses } from '../api/templateApi';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { Badge } from '../../../shared/components/ui/Badge';
import { Card } from '../../../shared/components/ui/Card';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { SectionHeading } from '../../../shared/components/ui/SectionHeading';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { getApiErrorMessage } from '../../../shared/lib/apiError';
import { useToast } from '../../../shared/hooks/useToast';
import { TemplateVersionHistory } from '../components/TemplateVersionHistory';
import type { Template, TemplateVariable } from '../types';
import { humanizeLabel } from '../../../shared/lib/display';

interface CreateFormValues {
  name: string;
  contractType: string;
}

const VARIABLE_TYPES: TemplateVariable['type'][] = ['text', 'number', 'date', 'boolean'];

export default function TemplatesPage() {
  const { data: templates, isLoading } = useAdminTemplates();
  const createTemplate = useCreateTemplate();
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateFormValues>();
  const { showToast } = useToast();

  const onCreate = handleSubmit((values) => {
    setFormError(null);
    createTemplate.mutate(
      { name: values.name, contractType: values.contractType, sections: [], variables: [] },
      {
        onSuccess: (template) => {
          showToast('Template created');
          reset();
          setExpandedId(template._id);
        },
        onError: (err) => setFormError(getApiErrorMessage(err)),
      }
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Administration"
        title="Templates"
        description="Reusable contract structures — sections built from the clause library, plus author-filled variables."
      />

      <Card elevated className="p-6 mb-6 space-y-4 animate-fade-in-up">
        <SectionHeading icon={LayoutTemplate} title="New template" />
        <form onSubmit={onCreate} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="template-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
            <Input id="template-name" {...register('name', { required: 'Required' })} />
            {errors.name && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="template-contract-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contract Type</label>
            <Select id="template-contract-type" {...register('contractType', { required: true })}>
              <option value="Vendor">Vendor</option>
              <option value="Employment">Employment</option>
              <option value="Customer">Customer</option>
              <option value="Partnership">Partnership</option>
              <option value="Service">Service</option>
            </Select>
          </div>
        </div>
        {formError && <p className="text-sm text-danger-600 dark:text-danger-400">{formError}</p>}
        <Button type="submit" loading={createTemplate.isPending}>
          {createTemplate.isPending ? 'Creating…' : 'Create template'}
        </Button>
        </form>
      </Card>

      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : !templates?.length ? (
          <Card className="flex flex-col items-center gap-3 py-14 text-center animate-fade-in">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
              <FileStack size={22} />
            </span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No templates yet</p>
          </Card>
        ) : (
          templates.map((template, i) => (
            <TemplateCard
              key={template._id}
              template={template}
              isExpanded={expandedId === template._id}
              onToggle={() => setExpandedId(expandedId === template._id ? null : template._id)}
              delay={i * 50}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface SectionFormValue {
  title: string;
  order: number;
  clauses: string[];
}
interface EditorFormValues {
  sections: SectionFormValue[];
  variables: TemplateVariable[];
  changeSummary: string;
}

function TemplateCard({ template, isExpanded, onToggle, delay = 0 }: { template: Template; isExpanded: boolean; onToggle: () => void; delay?: number }) {
  const updateTemplate = useUpdateTemplate(template._id);
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const toggleActive = () => {
    setError(null);
    updateTemplate.mutate(
      { isActive: !template.isActive },
      {
        onSuccess: () => showToast(template.isActive ? 'Template deactivated' : 'Template reactivated'),
        onError: (err) => setError(getApiErrorMessage(err)),
      }
    );
  };

  return (
    <Card className="animate-fade-in-up transition-shadow hover:shadow-elevated dark:hover:shadow-elevated-dark" style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}>
      <div className="px-4 py-3.5 flex items-center justify-between">
        <button onClick={onToggle} className="flex items-center gap-2.5 text-left flex-1 min-w-0">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-950/5 text-ink-900 dark:bg-white/10 dark:text-slate-200 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={14} />
          </span>
          <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{template.name}</span>
          <Badge tone="info">{humanizeLabel(template.contractType)}</Badge>
          <Badge tone={template.isActive ? 'success' : 'neutral'}>{template.isActive ? 'Active' : 'Inactive'}</Badge>
        </button>
        <button onClick={toggleActive} disabled={updateTemplate.isPending} className="rounded-md px-2 py-1 text-xs font-medium text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-600/15 ml-4 shrink-0 transition-colors">
          {template.isActive ? 'Deactivate' : 'Reactivate'}
        </button>
      </div>
      {error && <p className="text-sm text-danger-600 dark:text-danger-400 px-4 pb-2">{error}</p>}
      {isExpanded && (
        <div className="animate-fade-in-up">
          <TemplateEditor template={template} />
          <div className="border-t border-slate-100 dark:border-ink-800 px-4 py-4">
            <TemplateVersionHistory templateId={template._id} />
          </div>
        </div>
      )}
    </Card>
  );
}

function TemplateEditor({ template }: { template: Template }) {
  const updateTemplate = useUpdateTemplate(template._id);
  const { data: clauses } = useClauses();
  const { showToast } = useToast();
  const [saveError, setSaveError] = useState<string | null>(null);

  const { register, control, handleSubmit, reset } = useForm<EditorFormValues>({
    defaultValues: {
      sections: template.sections.map((s) => ({
        title: s.title,
        order: s.order,
        clauses: s.clauses.map((c) => (typeof c === 'string' ? c : c._id)),
      })),
      variables: template.variables,
      changeSummary: '',
    },
  });
  const sectionsArray = useFieldArray({ control, name: 'sections' });
  const variablesArray = useFieldArray({ control, name: 'variables' });

  const onSave = handleSubmit((values) => {
    setSaveError(null);
    updateTemplate.mutate(
      {
        sections: values.sections.map((s) => ({ ...s, order: Number(s.order) })),
        variables: values.variables,
        changeSummary: values.changeSummary || undefined,
      },
      {
        onSuccess: () => {
          showToast('Template saved');
          reset({ ...values, changeSummary: '' });
        },
        onError: (err) => setSaveError(getApiErrorMessage(err)),
      }
    );
  });

  return (
    <form onSubmit={onSave} className="border-t border-slate-100 dark:border-ink-800 px-4 py-4 space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white">Sections</h3>
          <Button
            type="button"
            variant="secondary"
            onClick={() => sectionsArray.append({ title: '', order: sectionsArray.fields.length + 1, clauses: [] })}
          >
            Add section
          </Button>
        </div>
        <div className="space-y-3">
          {sectionsArray.fields.map((field, index) => (
            <div key={field.id} className="border border-slate-200 dark:border-ink-800 rounded-md p-3 space-y-2">
              <div className="flex gap-2">
                <Input placeholder="Section title" {...register(`sections.${index}.title` as const, { required: true })} />
                <Input type="number" className="max-w-[80px]" {...register(`sections.${index}.order` as const, { valueAsNumber: true })} />
                <Button type="button" variant="secondary" onClick={() => sectionsArray.remove(index)}>Remove</Button>
              </div>
              <div>
                <label htmlFor={`template-section-${index}-clauses`} className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Clauses (ctrl/cmd-click to select multiple)</label>
                <select
                  id={`template-section-${index}-clauses`}
                  multiple
                  className="w-full rounded-lg border border-slate-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-sm min-h-[80px] transition-colors focus:outline-none focus:border-brass-500 dark:focus:border-brass-400 focus:ring-2 focus:ring-brass-500/20 dark:focus:ring-brass-400/20"
                  {...register(`sections.${index}.clauses` as const)}
                >
                  {clauses?.map((clause) => (
                    <option key={clause._id} value={clause._id}>{clause.title} ({clause.category})</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          {sectionsArray.fields.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">No sections yet.</p>}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-slate-900 dark:text-white">Variables</h3>
          <Button
            type="button"
            variant="secondary"
            onClick={() => variablesArray.append({ name: '', label: '', type: 'text', required: false })}
          >
            Add variable
          </Button>
        </div>
        <div className="space-y-2">
          {variablesArray.fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-center">
              <Input placeholder="name (e.g. renewalDate)" {...register(`variables.${index}.name` as const, { required: true })} />
              <Input placeholder="Label shown to author" {...register(`variables.${index}.label` as const, { required: true })} />
              <select className="rounded-lg border border-slate-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-sm transition-colors focus:outline-none focus:border-brass-500 dark:focus:border-brass-400 focus:ring-2 focus:ring-brass-500/20 dark:focus:ring-brass-400/20" {...register(`variables.${index}.type` as const)}>
                {VARIABLE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                <input type="checkbox" {...register(`variables.${index}.required` as const)} /> required
              </label>
              <Button type="button" variant="secondary" onClick={() => variablesArray.remove(index)}>Remove</Button>
            </div>
          ))}
          {variablesArray.fields.length === 0 && <p className="text-sm text-slate-400 dark:text-slate-500">No variables yet.</p>}
        </div>
      </div>

      {saveError && <p className="text-sm text-danger-600 dark:text-danger-400">{saveError}</p>}
      <div>
        <label htmlFor="template-change-summary" className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
          What changed? (recorded in version history)
        </label>
        <Input id="template-change-summary" placeholder="e.g. Updated payment terms clause" {...register('changeSummary')} />
      </div>
      <Button type="submit" loading={updateTemplate.isPending}>
        {updateTemplate.isPending ? 'Saving…' : 'Save template'}
      </Button>
    </form>
  );
}
