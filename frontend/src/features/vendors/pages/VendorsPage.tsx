import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Building, Users2, Pencil, Power } from 'lucide-react';
import { useAdminVendors, useCreateVendor, useUpdateVendor } from '../api/vendorApi';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Badge } from '../../../shared/components/ui/Badge';
import { Card } from '../../../shared/components/ui/Card';
import { PageHeader } from '../../../shared/components/ui/PageHeader';
import { SectionHeading } from '../../../shared/components/ui/SectionHeading';
import { TableContainer } from '../../../shared/components/ui/TableContainer';
import { Skeleton } from '../../../shared/components/ui/Skeleton';
import { getApiErrorMessage } from '../../../shared/lib/apiError';
import { useToast } from '../../../shared/hooks/useToast';
import { OPTIONAL_EMAIL_VALIDATION } from '../../../shared/lib/validation';
import type { Vendor } from '../types';
import { humanizeLabel } from '../../../shared/lib/display';

interface CreateFormValues {
  name: string;
  vendorCode: string;
  country: string;
  contactEmail?: string;
  contactPhone?: string;
}

const RISK_TONE: Record<string, 'success' | 'warning' | 'danger'> = {
  Low: 'success',
  Medium: 'warning',
  High: 'danger',
};

export default function VendorsPage() {
  const { data: vendors, isLoading } = useAdminVendors();
  const createVendor = useCreateVendor();
  const { showToast } = useToast();
  const [formError, setFormError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateFormValues>();

  const onCreate = handleSubmit((values) => {
    setFormError(null);
    createVendor.mutate(
      {
        name: values.name,
        vendorCode: values.vendorCode,
        country: values.country,
        contactEmail: values.contactEmail || undefined,
        contactPhone: values.contactPhone || undefined,
      },
      {
        onSuccess: () => {
          showToast('Vendor created');
          reset();
        },
        onError: (err) => setFormError(getApiErrorMessage(err)),
      }
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Administration"
        title="Vendors"
        description="Third parties your organization contracts with, with risk rating and active-contract counts."
      />

      <Card elevated className="p-6 mb-6 space-y-4 animate-fade-in-up">
        <SectionHeading icon={Building} title="Add vendor" />
        <form onSubmit={onCreate} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="vendor-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
            <Input id="vendor-name" {...register('name', { required: 'Required' })} />
            {errors.name && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="vendor-code" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vendor code</label>
            <Input id="vendor-code" {...register('vendorCode', { required: 'Required' })} placeholder="e.g. V-001" />
            {errors.vendorCode && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.vendorCode.message}</p>}
          </div>
          <div>
            <label htmlFor="vendor-country" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Country</label>
            <Input id="vendor-country" {...register('country', { required: 'Required' })} />
            {errors.country && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.country.message}</p>}
          </div>
          <div>
            <label htmlFor="vendor-contact-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact email (optional)</label>
            <Input id="vendor-contact-email" type="email" {...register('contactEmail', OPTIONAL_EMAIL_VALIDATION)} />
            {errors.contactEmail && <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">{errors.contactEmail.message}</p>}
          </div>
          <div>
            <label htmlFor="vendor-contact-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact phone (optional)</label>
            <Input id="vendor-contact-phone" {...register('contactPhone')} />
          </div>
        </div>
        {formError && <p className="text-sm text-danger-600 dark:text-danger-400">{formError}</p>}
        <Button type="submit" loading={createVendor.isPending}>
          {createVendor.isPending ? 'Adding…' : 'Add vendor'}
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
        ) : !vendors?.length ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center animate-fade-in">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/5 dark:text-slate-500">
              <Users2 size={22} />
            </span>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No vendors yet</p>
          </div>
        ) : (
          <TableContainer className="p-3 sm:p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-ink-800 text-left text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Vendor</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Country</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Risk</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Active Contracts</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 font-semibold text-[11px] uppercase tracking-wider w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <VendorRow
                  key={vendor._id}
                  vendor={vendor}
                  isEditing={editingId === vendor._id}
                  onEditStart={() => setEditingId(vendor._id)}
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

function VendorRow({
  vendor,
  isEditing,
  onEditStart,
  onEditEnd,
  onError,
}: {
  vendor: Vendor;
  isEditing: boolean;
  onEditStart: () => void;
  onEditEnd: () => void;
  onError: (msg: string | null) => void;
}) {
  const updateVendor = useUpdateVendor(vendor._id);
  const { showToast } = useToast();
  const [name, setName] = useState(vendor.name);
  const [country, setCountry] = useState(vendor.country);
  const [riskRating, setRiskRating] = useState(vendor.riskRating ?? '');

  const save = () => {
    onError(null);
    updateVendor.mutate(
      { name, country, riskRating: (riskRating || null) as Vendor['riskRating'] },
      {
        onSuccess: () => {
          showToast('Vendor updated');
          onEditEnd();
        },
        onError: (err) => onError(getApiErrorMessage(err)),
      }
    );
  };

  const toggleActive = () => {
    onError(null);
    updateVendor.mutate(
      { isActive: !vendor.isActive },
      {
        onSuccess: () => showToast(vendor.isActive ? 'Vendor deactivated' : 'Vendor reactivated'),
        onError: (err) => onError(getApiErrorMessage(err)),
      }
    );
  };

  if (isEditing) {
    return (
      <tr className="border-b border-slate-100 dark:border-ink-800">
        <td className="px-4 py-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-[160px]" />
          <span className="text-xs text-slate-400 dark:text-slate-500">{vendor.vendorCode}</span>
        </td>
        <td className="px-4 py-2">
          <Input value={country} onChange={(e) => setCountry(e.target.value)} className="max-w-[120px]" />
        </td>
        <td className="px-4 py-2">
          <select
            className="rounded-lg border border-slate-300 dark:border-ink-700 bg-white dark:bg-ink-900 text-slate-900 dark:text-slate-100 px-2 py-1 text-sm transition-colors focus:outline-none focus:border-brass-500 dark:focus:border-brass-400 focus:ring-2 focus:ring-brass-500/20 dark:focus:ring-brass-400/20"
            value={riskRating}
            onChange={(e) => setRiskRating(e.target.value)}
          >
            <option value="">Unrated</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </td>
        <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{vendor.activeContractsCount}</td>
        <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{vendor.isActive ? 'Active' : 'Inactive'}</td>
        <td className="px-4 py-2">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={save} disabled={updateVendor.isPending}>Save</Button>
            <Button variant="secondary" onClick={onEditEnd}>Cancel</Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-100 dark:border-ink-800 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
      <td className="px-4 py-2.5 text-slate-900 dark:text-white">
        {vendor.name}<br /><span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{vendor.vendorCode}</span>
      </td>
      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{vendor.country}</td>
      <td className="px-4 py-2.5">
        {vendor.riskRating ? (
          <Badge tone={RISK_TONE[vendor.riskRating]}>{humanizeLabel(vendor.riskRating)}</Badge>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 text-xs">Unrated</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{vendor.activeContractsCount}</td>
      <td className="px-4 py-2.5">
        <Badge tone={vendor.isActive ? 'success' : 'neutral'}>{vendor.isActive ? 'Active' : 'Inactive'}</Badge>
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
            disabled={updateVendor.isPending}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-danger-600 hover:bg-danger-50 transition-colors dark:text-danger-400 dark:hover:bg-danger-600/15 disabled:opacity-50"
          >
            <Power size={12} />
            {vendor.isActive ? 'Deactivate' : 'Reactivate'}
          </button>
        </div>
      </td>
    </tr>
  );
}
