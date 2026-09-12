import { useRef, useState } from 'react';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { useUploadDocument } from '../api/documentApi';
import { Select } from '../../../shared/components/ui/Select';
import type { DocumentType } from '../types';
import { useToast } from '../../../shared/hooks/useToast';

export function DocumentUpload({ contractId }: { contractId: string }) {
  const [type, setType] = useState<DocumentType>('Attachment');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadDocument(contractId);
  const { showToast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    upload.mutate(
      { file, type },
      {
        onSuccess: () => showToast('Document uploaded'),
        onSettled: () => {
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
      }
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={type} onChange={(e) => setType(e.target.value as DocumentType)} className="w-auto">
        <option value="Attachment">Attachment</option>
        <option value="SupportingDocument">Supporting Document</option>
        <option value="Amendment">Amendment</option>
        <option value="Policy">Policy</option>
        <option value="ScannedCopy">Scanned Copy</option>
      </Select>
      <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-ink-700 rounded-lg px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
        <Upload size={14} className="shrink-0" />
        Choose file
        <input ref={fileInputRef} type="file" onChange={handleFileChange} className="sr-only" disabled={upload.isPending} />
      </label>
      {upload.isPending && (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Loader2 size={13} className="animate-spin" />
          Uploading…
        </span>
      )}
      {upload.isError && (
        <span className="inline-flex items-center gap-1.5 text-xs text-danger-600 dark:text-danger-400">
          <AlertCircle size={13} />
          Upload failed
        </span>
      )}
    </div>
  );
}
