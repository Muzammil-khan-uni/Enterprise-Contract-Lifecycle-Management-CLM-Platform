

const DASHBOARD_KEYS = ['dashboard-summary', 'dashboard-expiring', 'dashboard-by-department', 'dashboard-by-vendor', 'dashboard-risk'];

export const REALTIME_QUERY_MAP: Record<string, string[]> = {
  
  
  
  
  
  Contract: ['contracts', 'contract', 'renewal-candidates', ...DASHBOARD_KEYS],
  ContractVersion: ['contract-versions', 'version-comparison', 'version-range-comparison', 'contract'],
  
  
  
  
  ApprovalWorkflow: ['contract-workflows', 'approval-queue', 'contract', 'dashboard-risk'],
  
  
  
  
  
  Signature: ['contract-signatures', 'contract', 'my-signatures'],
  
  
  
  
  Obligation: ['contract-obligations', 'my-obligations', 'dashboard-summary', 'dashboard-risk'],
  Document: ['contract-documents'],
  
  
  Vendor: ['admin-vendors', 'dashboard-by-vendor', 'dashboard-risk'],
  User: ['admin-users', 'user-directory'],
  Template: ['admin-templates', 'active-templates', 'template', 'template-for-authoring'],
  
  
  
  
  
  
  TemplateVersion: ['template-versions', 'template-version-compare'],
  Clause: ['clauses'],
  BusinessUnit: ['business-units', ...DASHBOARD_KEYS],
  Department: ['departments', ...DASHBOARD_KEYS],
  AuditLog: ['audit-logs'],
};
