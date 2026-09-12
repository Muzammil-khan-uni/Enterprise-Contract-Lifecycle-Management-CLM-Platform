import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { useUpdateContract } from '../api/contractApi';
import { useBusinessUnits, useDepartments } from '../../org-structure/api/orgStructureApi';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { getApiErrorMessage } from '../../../shared/lib/apiError';
import { localDateInputToISOString } from '../../../shared/lib/localDate';
import { useToast } from '../../../shared/hooks/useToast';
import type { Contract } from '../types';

interface PartyFormValue {
  partyType: string;
  name: string;
  role: string;
}

interface EditFormValues {
  title: string;
  contractType: string;
  department: string;
  businessUnit: string;
  effectiveDate: string;
  expiryDate: string;
  contractValue: string;
  parties: PartyFormValue[];
}

function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

export function EditContractForm({ contract, onDone }: { contract: Contract; onDone: () => void }) {
  const updateContract = useUpdateContract(contract._id);
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<EditFormValues>({
    defaultValues: {
      title: contract.title,
      contractType: contract.contractType,
      department: contract.department,
      businessUnit: contract.businessUnit,
      effectiveDate: toDateInputValue(contract.effectiveDate),
      expiryDate: toDateInputValue(contract.expiryDate),
      contractValue: contract.contractValue != null ? String(contract.contractValue) : '',
      parties: contract.parties.map((p) => ({ partyType: p.partyType, name: p.name, role: p.role })),
    },
  });
  const { fields: partyFields, append: appendParty, remove: removeParty } = useFieldArray({ control, name: 'parties' });
  const selectedBusinessUnit = watch('businessUnit');
  const { data: businessUnits } = useBusinessUnits();
  const { data: departments } = useDepartments(selectedBusinessUnit || undefined);

  const onSubmit = handleSubmit((values) => {
    updateContract.mutate(
      {
        title: values.title,
        contractType: values.contractType,
        department: values.department,
        businessUnit: values.businessUnit,
        parties: values.parties.filter((p) => p.name.trim() !== '' || p.role.trim() !== ''),
        
        
        
        effectiveDate: values.effectiveDate ? localDateInputToISOString(values.effectiveDate) : undefined,
        expiryDate: values.expiryDate ? localDateInputToISOString(values.expiryDate) : undefined,
        contractValue: values.contractValue ? Number(values.contractValue) : undefined,
      },
      { onSuccess: () => { showToast('Contract updated'); onDone(); } }
    );
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="edit-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
        <Input id="edit-title" {...register('title', { required: 'Title is required' })} />
        {errors.title && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="edit-business-unit" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Business Unit</label>
          <Select id="edit-business-unit" {...register('businessUnit', { required: true })}>
            {businessUnits?.map((u) => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="edit-department" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
          <Select id="edit-department" {...register('department', { required: true })}>
            {departments?.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="block text-sm font-medium text-slate-700 dark:text-slate-300">Parties</span>
          <button
            type="button"
            onClick={() => appendParty({ partyType: 'Vendor', name: '', role: '' })}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-brass-600 hover:bg-brass-50 transition-colors dark:text-brass-300 dark:hover:bg-brass-500/10"
          >
            <Plus size={13} />
            + Add Party
          </button>
        </div>
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
              <Input aria-label={`Party ${index + 1} name`} placeholder="Name" {...register(`parties.${index}.name` as const)} />
              <Input aria-label={`Party ${index + 1} role`} placeholder="Role" {...register(`parties.${index}.role` as const)} />
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="edit-effective-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Effective Date</label>
          <Input id="edit-effective-date" type="date" {...register('effectiveDate')} />
        </div>
        <div>
          <label htmlFor="edit-expiry-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expiry Date</label>
          <Input id="edit-expiry-date" type="date" {...register('expiryDate')} />
        </div>
      </div>

      <div>
        <label htmlFor="edit-value" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Value</label>
        <Input id="edit-value" type="number" step="0.01" {...register('contractValue')} />
      </div>

      {updateContract.isError && (
        <p className="flex items-center gap-2 text-sm text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-600/15 border border-danger-100 dark:border-danger-600/30 rounded-lg px-3 py-2 animate-fade-in">
          {getApiErrorMessage(updateContract.error)}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={updateContract.isPending} loading={updateContract.isPending}>
          {updateContract.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
