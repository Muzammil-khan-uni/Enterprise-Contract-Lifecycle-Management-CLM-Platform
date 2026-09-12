import { UserRole, Permission } from '../../modules/users/user.types';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: Object.values(Permission), 

  [UserRole.LEGAL_OFFICER]: [
    Permission.CONTRACT_CREATE,
    Permission.CONTRACT_READ,
    Permission.CONTRACT_UPDATE,
    Permission.WORKFLOW_APPROVE_LEGAL,
    Permission.OBLIGATION_MANAGE,
    Permission.VENDOR_MANAGE,
    Permission.ORG_STRUCTURE_MANAGE,
    Permission.AUDIT_READ,
    Permission.DASHBOARD_READ,
  ],

  [UserRole.FINANCE_OFFICER]: [
    Permission.CONTRACT_READ,
    Permission.WORKFLOW_APPROVE_FINANCE,
    Permission.OBLIGATION_MANAGE,
    Permission.DASHBOARD_READ,
  ],

  [UserRole.EXECUTIVE]: [
    Permission.CONTRACT_READ,
    Permission.CONTRACT_READ_ALL_UNITS,
    Permission.WORKFLOW_APPROVE_EXECUTIVE,
    Permission.AUDIT_READ,
    Permission.DASHBOARD_READ,
  ],

  [UserRole.DEPARTMENT_USER]: [
    Permission.CONTRACT_CREATE,
    Permission.CONTRACT_READ,
    Permission.CONTRACT_UPDATE,
    Permission.OBLIGATION_MANAGE,
  ],

  [UserRole.VENDOR]: [
    
    
    
    
    
    
    Permission.CONTRACT_READ,
  ],
};

export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
