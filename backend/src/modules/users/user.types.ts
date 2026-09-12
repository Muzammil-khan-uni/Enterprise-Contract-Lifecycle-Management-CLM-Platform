

export enum UserRole {
  ADMIN = 'Admin',
  LEGAL_OFFICER = 'LegalOfficer',
  FINANCE_OFFICER = 'FinanceOfficer',
  EXECUTIVE = 'Executive',
  DEPARTMENT_USER = 'DepartmentUser',
  VENDOR = 'Vendor',
}

export enum Permission {
  CONTRACT_CREATE = 'contract:create',
  CONTRACT_READ = 'contract:read',
  CONTRACT_UPDATE = 'contract:update',
  CONTRACT_DELETE = 'contract:delete',
  CONTRACT_READ_ALL_UNITS = 'contract:read:all_units',

  WORKFLOW_APPROVE_LEGAL = 'workflow:approve:legal',
  WORKFLOW_APPROVE_FINANCE = 'workflow:approve:finance',
  WORKFLOW_APPROVE_EXECUTIVE = 'workflow:approve:executive',

  OBLIGATION_MANAGE = 'obligation:manage',

  VENDOR_MANAGE = 'vendor:manage',

  AUDIT_READ = 'audit:read',

  DASHBOARD_READ = 'dashboard:read',

  USER_MANAGE = 'user:manage',

  ORG_STRUCTURE_MANAGE = 'org_structure:manage',
}

export interface JwtAccessPayload {
  sub: string; 
  role: UserRole;
  businessUnit: string | null;
  tenant: string; 
  permissions: Permission[];
  
  
  
  
  
  
  
  isPlatformSuperAdmin: boolean;
}

export interface JwtRefreshPayload {
  sub: string;
  tokenVersion: number; 
}
