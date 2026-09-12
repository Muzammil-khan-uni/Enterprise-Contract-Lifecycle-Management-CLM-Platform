export type AuditAction = 'Create' | 'Update' | 'Delete' | 'Approve' | 'Reject' | 'Sign' | 'Download' | 'StatusChange' | 'Login';

export interface AuditLogEntry {
  _id: string;
  
  
  
  actor: { _id: string; name: string; email: string } | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  timestamp: string;
}
