import { userService } from '../../src/modules/users/user.service';
import { UserRole, Permission } from '../../src/modules/users/user.types';

describe('userService.getEffectivePermissions', () => {
  it('merges role defaults with overrides, deduplicated', () => {
    const perms = userService.getEffectivePermissions(UserRole.DEPARTMENT_USER, [
      Permission.AUDIT_READ,
      Permission.CONTRACT_CREATE, 
    ]);

    const occurrences = perms.filter((p) => p === Permission.CONTRACT_CREATE).length;
    expect(occurrences).toBe(1);
    expect(perms).toContain(Permission.AUDIT_READ);
  });
});

describe('userService password hashing', () => {
  it('hashes and verifies a password round-trip', async () => {
    const hash = await userService.hashPassword('SuperSecret123');
    expect(hash).not.toEqual('SuperSecret123');
    const valid = await userService.verifyPassword('SuperSecret123', hash);
    expect(valid).toBe(true);
    const invalid = await userService.verifyPassword('WrongPassword', hash);
    expect(invalid).toBe(false);
  });
});
