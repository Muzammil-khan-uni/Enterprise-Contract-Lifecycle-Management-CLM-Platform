import { useState } from 'react';
import { FileText, Download, Trash2, ScanText } from 'lucide-react';
import { useDeleteDocument, useDownloadDocument } from '../api/documentApi';
import { Button } from '../../../shared/components/ui/Button';
import type { ContractDocument } from '../types';
import { useToast } from '../../../shared/hooks/useToast';
import { humanizeLabel } from '../../../shared/lib/display';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList({ documents, contractId }: { documents: ContractDocument[]; contractId: string }) {
  const deleteDocument = useDeleteDocument(contractId);
  const { showToast } = useToast();
  const downloadDocument = useDownloadDocument(contractId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center animate-fade-in">
        <FileText size={22} className="text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-500 dark:text-slate-400">No documents uploaded yet.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-ink-800">
      {documents.map((doc, i) => (
        <li
          key={doc._id}
          className="py-2.5 flex flex-col gap-2 text-sm animate-fade-in-up"
          style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'backwards' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="min-w-0 flex items-start gap-2">
              <FileText size={15} className="shrink-0 text-slate-400 dark:text-slate-500 mt-0.5" />
              <div className="min-w-0">
                <button
                  onClick={() => downloadDocument.mutate(doc._id)}
                  disabled={downloadDocument.isPending}
                  className="inline-flex items-center gap-1.5 text-brass-600 dark:text-brass-300 hover:text-brass-700 dark:hover:text-brass-200 hover:underline font-medium text-left disabled:opacity-50 break-all"
                >
                  {doc.fileName}
                  <Download size={12} className="shrink-0" />
                </button>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {humanizeLabel(doc.type)} · {formatSize(doc.sizeBytes)} · {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              {doc.ocrText && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setExpandedId(expandedId === doc._id ? null : doc._id)}
                >
                  <ScanText size={13} />
                  {expandedId === doc._id ? 'Hide extracted text' : 'View extracted text'}
                </Button>
              )}
              <Button variant="danger" size="sm" onClick={() => deleteDocument.mutate(doc._id, { onSuccess: () => showToast('Document deleted') })} loading={deleteDocument.isPending}>
                <Trash2 size={13} />
                Delete
              </Button>
            </div>
          </div>
          {expandedId === doc._id && doc.ocrText && (
            <pre className="whitespace-pre-wrap text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-ink-950 border border-slate-200 dark:border-ink-800 rounded-lg p-3 max-h-64 overflow-y-auto animate-fade-in-up">
              {doc.ocrText}
            </pre>
          )}
        </li>
      ))}
    </ul>
  );
}
