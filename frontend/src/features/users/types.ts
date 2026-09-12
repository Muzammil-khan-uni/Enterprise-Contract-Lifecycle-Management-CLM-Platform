export type UserRole = 'Admin' | 'LegalOfficer' | 'FinanceOfficer' | 'Executive' | 'DepartmentUser' | 'Vendor';

export interface DirectoryUser {
  id: string;
  name: string;
  email: string;
}

export interface AdminUserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  businessUnit: string | { _id: string; name: string; code: string } | null;
  department: string | { _id: string; name: string; code: string } | null;
  permissionOverrides: string[];
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}
