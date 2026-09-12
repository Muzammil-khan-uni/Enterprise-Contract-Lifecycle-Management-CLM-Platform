import { auditRepository } from '../../src/modules/audit/audit.repository';

describe('auditRepository append-only shape', () => {
  it('exposes only create and read methods — never update or delete', () => {
    const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(auditRepository)).filter(
      (name) => name !== 'constructor'
    );

    expect(methodNames.sort()).toEqual(['create', 'list', 'listForEntity'].sort());
    expect(methodNames).not.toContain('updateById');
    expect(methodNames).not.toContain('deleteById');
  });
});
