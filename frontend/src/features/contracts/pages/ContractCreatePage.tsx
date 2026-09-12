import { useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Plus, X, ShieldAlert, FileText, Users2, Building2, CalendarRange } from 'lucide-react';
import { useCreateContract } from '../api/contractApi';
import { useBusinessUnits, useDepartments } from '../../org-structure/api/orgStructureApi';
import { useActiveTemplates, useTemplateForAuthoring } from '../../templates/api/templateApi';
import type { Clause, TemplateVariable } from '../../templates/types';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { Card } from '../../../shared/components/ui/Card';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { SectionHeading } from '../../../shared/components/ui/SectionHeading';
import { localDateInputToISOString } from '../../../shared/lib/localDate';
import { useToast } from '../../../shared/hooks/useToast';
import { isAxiosError } from 'axios';

interface PartyFormValue {
  partyType: string;
  name: string;
  role: string;
}

interface FormValues {
  title: string;
  contractType: string;
  department: string;
  businessUnit: string;
  effectiveDate?: string;
  expiryDate?: string;
  contractValue?: string;
  currency?: string;
  templateId?: string;
  variables?: Record<string, string>;
  parties: PartyFormValue[];
}

function isClauseObject(clause: string | Clause): clause is Clause {
  return typeof clause !== 'string';
}

function coerceVariableValue(variable: TemplateVariable, raw: string | undefined): unknown {
  if (raw === undefined || raw === '') return undefined;
  switch (variable.type) {
    case 'number':
      return Number(raw);
    case 'boolean':
      return raw === 'true';
    default:
      return raw;
  }
}

interface ApiErrorBody {
  message?: string;
  details?: { fieldErrors?: Record<string, string[]> };
}

function getCreateErrorMessage(error: unknown): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data;
    const fieldErrors = body?.details?.fieldErrors;
    if (fieldErrors) {
      const [field, messages] = Object.entries(fieldErrors).find(([, msgs]) => msgs?.length) ?? [];
      if (field && messages?.length) return `${field}: ${messages[0]}`;
    }
    if (body?.message) return body.message;
  }
  return 'Could not create the contract. Please check the fields and try again.';
}

export default function ContractCreatePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const createContract = useCreateContract();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { parties: [] } });
  const { fields: partyFields, append: appendParty, remove: removeParty } = useFieldArray({ control, name: 'parties' });

  const selectedBusinessUnit = watch('businessUnit');
  const selectedContractType = watch('contractType');
  const selectedTemplateId = watch('templateId');
  const variableValues = watch('variables');

  const { data: businessUnits } = useBusinessUnits();
  const { data: departments } = useDepartments(selectedBusinessUnit || undefined);
  const { data: activeTemplates } = useActiveTemplates();
  const { data: template } = useTemplateForAuthoring(selectedTemplateId || undefined);

  const templatesForType = useMemo(
    () => (activeTemplates ?? []).filter((t) => t.contractType === selectedContractType),
    [activeTemplates, selectedContractType]
  );

  
  
  
  
  useEffect(() => {
    setValue('templateId', '');
  }, [selectedContractType, setValue]);

  const previewSections = useMemo(() => {
    if (!template) return [];
    return [...template.sections]
      .sort((a, b) => a.order - b.order)
      .map((section) => {
        const text = section.clauses
          .filter(isClauseObject)
          .map((clause) =>
            clause.text.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => variableValues?.[name] || `{{${name}}}`)
          )
          .join('\n\n');
        return { title: section.title, order: section.order, text };
      });
  }, [template, variableValues]);

  const onSubmit = handleSubmit((values) => {
    const payload: Record<string, unknown> = {
      title: values.title,
      contractType: values.contractType,
      department: values.department,
      businessUnit: values.businessUnit,
      
      
      
      // Only send parties that have BOTH name and role filled in — the backend
      // requires both, so a half-filled row (only name or only role) must be
      // dropped here rather than sent as invalid data.
      parties: (values.parties ?? []).filter((p) => p.name.trim() !== '' && p.role.trim() !== ''),
      
      
      
      
      
      
      effectiveDate: values.effectiveDate ? localDateInputToISOString(values.effectiveDate) : undefined,
      expiryDate: values.expiryDate ? localDateInputToISOString(values.expiryDate) : undefined,
      contractValue: values.contractValue ? Number(values.contractValue) : undefined,
      currency: values.currency || undefined,
    };

    if (values.templateId && template) {
      payload.templateId = values.templateId;
      payload.variableValues = Object.fromEntries(
        template.variables
          .map((variable) => [variable.name, coerceVariableValue(variable, values.variables?.[variable.name])])
          .filter(([, value]) => value !== undefined)
      );
    }

    createContract.mutate(payload, {
      onSuccess: (contract) => {
        showToast('Contract created');
        navigate(`/contracts/${contract._id}`);
      },
    });
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <PageHeader eyebrow="Workspace" title="New Contract" description="Start from a template or begin blank — you can fill in the rest as it moves through review." />

      <form onSubmit={onSubmit} className="space-y-4 sm:space-y-6">
        <Card elevated className="p-5 sm:p-6 space-y-4 animate-fade-in-up">
          <SectionHeading icon={FileText} title="Basics" />
          <div>
            <label htmlFor="contract-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
            <Input id="contract-title" {...register('title', { required: 'Title is required' })} />
            {errors.title && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="contract-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contract Type</label>
            <Select id="contract-type" {...register('contractType', { required: true })}>
              <option value="Vendor">Vendor</option>
              <option value="Employment">Employment</option>
              <option value="Customer">Customer</option>
              <option value="Partnership">Partnership</option>
              <option value="Service">Service</option>
            </Select>
          </div>

          <div>
            <label htmlFor="contract-template" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Start from Template <span className="font-normal text-slate-400 dark:text-slate-500">(optional)</span>
            </label>
            <Select id="contract-template" {...register('templateId')}>
              <option value="">None — start blank</option>
              {templatesForType.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </Select>
            {selectedContractType && templatesForType.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No active templates for {selectedContractType} contracts yet.</p>
            )}
          </div>

          {template && (
            <div className="rounded-lg border border-slate-200 dark:border-ink-800 p-4 space-y-3 bg-slate-50 dark:bg-ink-950 animate-fade-in-up">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Template Variables</p>
              {template.variables.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">This template has no variables to fill in.</p>
              )}
              {template.variables.map((variable) => (
                <div key={variable.name}>
                  <label htmlFor={`variable-${variable.name}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {variable.label} {variable.required && <span className="text-danger-600 dark:text-danger-400">*</span>}
                  </label>
                  {variable.type === 'boolean' ? (
                    <Select id={`variable-${variable.name}`} {...register(`variables.${variable.name}`, { required: variable.required })}>
                      <option value="">Select…</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </Select>
                  ) : (
                    <Input
                      id={`variable-${variable.name}`}
                      type={variable.type === 'number' ? 'number' : variable.type === 'date' ? 'date' : 'text'}
                      {...register(`variables.${variable.name}`, { required: variable.required })}
                    />
                  )}
                </div>
              ))}

              {previewSections.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-ink-800">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Preview</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {previewSections.map((section) => (
                      <div key={section.order}>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{section.order}. {section.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-pre-wrap">{section.text || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="p-5 sm:p-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '60ms', animationFillMode: 'backwards' }}>
          <SectionHeading icon={Building2} title="Organization" description="Determines who can see and approve this contract." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contract-business-unit" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Business Unit</label>
              <Select id="contract-business-unit" {...register('businessUnit', { required: 'Required' })}>
                <option value="">Select…</option>
                {businessUnits?.map((u) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </Select>
              {errors.businessUnit && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.businessUnit.message}</p>}
            </div>
            <div>
              <label htmlFor="contract-department" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
              <Select id="contract-department" disabled={!selectedBusinessUnit} {...register('department', { required: 'Required' })}>
                <option value="">{selectedBusinessUnit ? 'Select…' : 'Pick a business unit first'}</option>
                {departments?.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </Select>
              {errors.department && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.department.message}</p>}
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 space-y-3 animate-fade-in-up" style={{ animationDelay: '110ms', animationFillMode: 'backwards' }}>
          <div className="flex items-center justify-between">
            <SectionHeading icon={Users2} title="Parties" description="Usually a vendor, customer, or internal counterpart." />
            <button
              type="button"
              onClick={() => appendParty({ partyType: 'Vendor', name: '', role: '' })}
              className="inline-flex items-center gap-1 shrink-0 rounded-md px-2 py-1 text-xs font-medium text-brass-600 hover:bg-brass-50 transition-colors dark:text-brass-300 dark:hover:bg-brass-500/10"
            >
              <Plus size={13} />
              + Add Party
            </button>
          </div>
          {partyFields.length === 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">No parties added yet — optional.</p>
          )}
          <div className="space-y-2">
            {partyFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-start animate-fade-in-up">
                <Select
                  aria-label={`Party ${index + 1} type`}
                  {...register(`parties.${index}.partyType` as const)}
                >
                  <option value="Internal">Internal</option>
                  <option value="Vendor">Vendor</option>
                  <option value="Customer">Customer</option>
                </Select>
                <div>
                  <Input
                    aria-label={`Party ${index + 1} name`}
                    placeholder="Name"
                    {...register(`parties.${index}.name` as const, {
                      validate: (value, formValues) =>
                        !value?.trim() && formValues.parties?.[index]?.role?.trim()
                          ? 'Required if role is filled in'
                          : true,
                    })}
                  />
                  {errors.parties?.[index]?.name && (
                    <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.parties[index]?.name?.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    aria-label={`Party ${index + 1} role`}
                    placeholder="Role"
                    {...register(`parties.${index}.role` as const, {
                      validate: (value, formValues) =>
                        !value?.trim() && formValues.parties?.[index]?.name?.trim()
                          ? 'Required if name is filled in'
                          : true,
                    })}
                  />
                  {errors.parties?.[index]?.role && (
                    <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.parties[index]?.role?.message}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeParty(index)}
                  aria-label={`Remove party ${index + 1}`}
                  className="rounded-md p-2 text-slate-400 hover:bg-danger-50 hover:text-danger-600 transition-colors dark:text-slate-500 dark:hover:bg-danger-600/15 dark:hover:text-danger-400"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 sm:p-6 space-y-4 animate-fade-in-up" style={{ animationDelay: '160ms', animationFillMode: 'backwards' }}>
          <SectionHeading icon={CalendarRange} title="Dates & Value" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contract-effective-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Effective Date</label>
              <Input id="contract-effective-date" type="date" {...register('effectiveDate')} />
            </div>
            <div>
              <label htmlFor="contract-expiry-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expiry Date</label>
              <Input id="contract-expiry-date" type="date" {...register('expiryDate')} />
            </div>
          </div>

          <div>
            <label htmlFor="contract-value" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Value</label>
            <Input id="contract-value" type="number" step="0.01" {...register('contractValue')} />
          </div>
        </Card>

        {createContract.isError && (
          <p className="flex items-center gap-2 text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-600/15 border border-danger-100 dark:border-danger-600/30 rounded-lg px-3 py-2 animate-fade-in">
            <ShieldAlert size={15} className="shrink-0" />
            {getCreateErrorMessage(createContract.error)}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={createContract.isPending} loading={createContract.isPending}>
          {createContract.isPending ? 'Creating…' : 'Create Contract'}
        </Button>
      </form>
    </div>
  );
}
