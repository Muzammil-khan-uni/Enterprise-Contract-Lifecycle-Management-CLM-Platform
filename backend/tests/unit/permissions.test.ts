import { getRolePermissions } from '../../src/core/middleware/permissions.config';
import { UserRole, Permission } from '../../src/modules/users/user.types';

describe('permissions.config', () => {
  it('grants Admin every permission', () => {
    const adminPerms = getRolePermissions(UserRole.ADMIN);
    expect(adminPerms).toEqual(expect.arrayContaining(Object.values(Permission)));
  });

  it('does not grant FinanceOfficer contract creation', () => {
    const financePerms = getRolePermissions(UserRole.FINANCE_OFFICER);
    expect(financePerms).not.toContain(Permission.CONTRACT_CREATE);
    expect(financePerms).toContain(Permission.WORKFLOW_APPROVE_FINANCE);
  });

  it('scopes Vendor permissions narrowly', () => {
    const vendorPerms = getRolePermissions(UserRole.VENDOR);
    expect(vendorPerms).toContain(Permission.CONTRACT_READ);
    expect(vendorPerms).not.toContain(Permission.USER_MANAGE);
    expect(vendorPerms).not.toContain(Permission.CONTRACT_UPDATE);
  });
});
