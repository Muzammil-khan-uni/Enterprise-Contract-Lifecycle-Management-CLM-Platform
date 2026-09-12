import { useForm } from 'react-hook-form';
import { Send } from 'lucide-react';
import { useInitiateSignature } from '../api/signatureApi';
import { useUserDirectory } from '../../users/api/userAdminApi';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Select } from '../../../shared/components/ui/Select';
import { EMAIL_VALIDATION } from '../../../shared/lib/validation';
import { useToast } from '../../../shared/hooks/useToast';

interface FormValues {
  signerType: 'Internal' | 'External';
  userId: string;
  name: string;
  email: string;
}

export function InitiateSignatureForm({ contractId }: { contractId: string }) {
  const initiate = useInitiateSignature(contractId);
  const { showToast } = useToast();
  const { data: directory } = useUserDirectory();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { signerType: 'External' } });
  const signerType = watch('signerType');

  const onSubmit = handleSubmit((values) => {
    if (values.signerType === 'Internal') {
      const chosen = directory?.find((u) => u.id === values.userId);
      if (!chosen) return;
      initiate.mutate([{ signerType: 'Internal', userId: chosen.id, name: chosen.name, email: chosen.email }], {
        onSuccess: () => showToast('Signature request sent'),
      });
    } else {
      initiate.mutate([{ signerType: 'External', name: values.name, email: values.email }], {
        onSuccess: () => showToast('Signature request sent'),
      });
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <div>
        <label htmlFor="signer-type" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Signer type</label>
        <Select
          id="signer-type"
          className="w-auto h-[38px]"
          {...register('signerType')}
        >
          <option value="External">External</option>
          <option value="Internal">Internal</option>
        </Select>
      </div>

      {signerType === 'Internal' ? (
        <div>
          <label htmlFor="signer-user" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Internal signer</label>
          <Select
            id="signer-user"
            className="h-[38px] w-56"
            {...register('userId', { required: 'Required' })}
          >
            <option value="">Select a person…</option>
            {directory?.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </Select>
          {errors.userId && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.userId.message}</p>}
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="signer-name" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Signer name</label>
            <Input id="signer-name" {...register('name', { required: signerType === 'External' })} className="w-40" />
            {errors.name && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">Required</p>}
          </div>
          <div>
            <label htmlFor="signer-email" className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Signer email</label>
            <Input
              id="signer-email"
              type="email"
              {...register('email', { required: signerType === 'External' ? 'Required' : false, ...EMAIL_VALIDATION })}
              className="w-56"
            />
            {errors.email && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.email.message}</p>}
          </div>
        </>
      )}

      <Button type="submit" loading={initiate.isPending}>
        <Send size={14} />
        {initiate.isPending ? 'Sending…' : 'Request Signature'}
      </Button>
    </form>
  );
}
