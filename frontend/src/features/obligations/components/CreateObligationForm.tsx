import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PlusCircle } from 'lucide-react';
import { useCreateObligation } from '../api/obligationApi';
import { useUserDirectory } from '../../users/api/userAdminApi';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { getApiErrorMessage } from '../../../shared/lib/apiError';
import { localDateInputToISOString } from '../../../shared/lib/localDate';
import { useToast } from '../../../shared/hooks/useToast';

interface FormValues {
  type: string;
  description: string;
  dueDate: string;
  recurrence: string;
  assignedTo: string;
  amount: string;
  currency: string;
  slaThreshold: string;
  slaPenalty: string;
}

export function CreateObligationForm({ contractId }: { contractId: string }) {
  const { showToast } = useToast();
  const createObligation = useCreateObligation(contractId);
  const { data: directory } = useUserDirectory();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: {
      type: 'Payment',
      recurrence: 'None',
      assignedTo: '',
      amount: '',
      currency: 'USD',
      slaThreshold: '',
      slaPenalty: '',
    },
  });
  const selectedType = watch('type');
  const isPayment = selectedType === 'Payment';
  const isSla = selectedType === 'SLA';

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    createObligation.mutate(
      {
        type: values.type,
        description: values.description,
        
        
        
        
        dueDate: localDateInputToISOString(values.dueDate),
        recurrence: values.recurrence,
        assignedTo: values.assignedTo || undefined,
        amount: values.type === 'Payment' && values.amount ? Number(values.amount) : undefined,
        currency: values.type === 'Payment' && values.currency ? values.currency : undefined,
        slaThreshold: values.type === 'SLA' && values.slaThreshold ? values.slaThreshold : undefined,
        slaPenalty: values.type === 'SLA' && values.slaPenalty ? values.slaPenalty : undefined,
      },
      {
        onSuccess: () => {
          showToast('Obligation added');
          reset();
        },
        onError: (err) => setFormError(getApiErrorMessage(err)),
      }
    );
  });

  return (
    <form onSubmit={onSubmit}>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="obligation-type" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Type</label>
          <Select id="obligation-type" className="w-auto" {...register('type')}>
            <option>Payment</option>
            <option>Service</option>
            <option>Deliverable</option>
            <option>SLA</option>
            <option>Renewal</option>
            <option>Compliance</option>
          </Select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label htmlFor="obligation-description" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Description</label>
          <Input id="obligation-description" {...register('description', { required: true })} />
        </div>
        {isPayment && (
          <>
            <div>
              <label htmlFor="obligation-amount" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Amount</label>
              <Input
                id="obligation-amount"
                type="number"
                step="0.01"
                min="0"
                {...register('amount', { required: isPayment })}
              />
            </div>
            <div>
              <label htmlFor="obligation-currency" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Currency</label>
              <Input
                id="obligation-currency"
                maxLength={3}
                className="w-20 uppercase"
                {...register('currency', { required: isPayment })}
              />
            </div>
          </>
        )}
        {isSla && (
          <>
            <div className="min-w-[160px]">
              <label htmlFor="obligation-sla-threshold" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">SLA threshold</label>
              <Input id="obligation-sla-threshold" placeholder="e.g. Response within 4 business hours" {...register('slaThreshold')} />
            </div>
            <div className="min-w-[160px]">
              <label htmlFor="obligation-sla-penalty" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Breach penalty</label>
              <Input id="obligation-sla-penalty" placeholder="e.g. 5% service credit" {...register('slaPenalty')} />
            </div>
          </>
        )}
        <div>
          <label htmlFor="obligation-due-date" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Due date</label>
          <Input id="obligation-due-date" type="date" {...register('dueDate', { required: true })} />
        </div>
        <div>
          <label htmlFor="obligation-recurrence" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Recurrence</label>
          <Select id="obligation-recurrence" className="w-auto" {...register('recurrence')}>
            <option>None</option>
            <option>Weekly</option>
            <option>Monthly</option>
            <option>Quarterly</option>
            <option>Annually</option>
          </Select>
        </div>
        <div>
          <label htmlFor="obligation-assignee" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Assign to</label>
          <Select
            id="obligation-assignee"
            className="w-auto"
            {...register('assignedTo')}
          >
            <option value="">Unassigned</option>
            {directory?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" loading={createObligation.isPending}>
          <PlusCircle size={15} />
          {createObligation.isPending ? 'Adding…' : 'Add'}
        </Button>
      </div>
      {formError && <p className="text-sm text-danger-600 dark:text-danger-400 mt-2">{formError}</p>}
    </form>
  );
}
