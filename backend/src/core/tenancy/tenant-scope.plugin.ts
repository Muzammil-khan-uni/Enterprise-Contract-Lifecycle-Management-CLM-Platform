import { Schema, Types, Query, Aggregate } from 'mongoose';
import { getCurrentTenantId } from './tenant-context';

export function tenantScopePlugin(schema: Schema): void {
  schema.add({
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  } as never);

  schema.pre('validate', function (next) {
    
    const doc = this as unknown as { tenant?: Types.ObjectId; isNew: boolean };
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      next(new Error('Tenant context is required to create or validate this tenant-scoped document.'));
      return;
    }

    const currentTenant = new Types.ObjectId(tenantId);
    if (doc.tenant && doc.tenant.toString() !== tenantId) {
      next(new Error('Tenant ownership cannot be changed.'));
      return;
    }

    
    
    doc.tenant = currentTenant;
    next();
  });

  
  
  
  schema.pre(/^findOneAndUpdate$/, function (this: Query<unknown, unknown>, next) {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      next(new Error('Tenant context is required to update this tenant-scoped document.'));
      return;
    }

    const update = this.getUpdate() as Record<string, unknown>;
    const directTenant = update.tenant;
    const set = (update.$set ?? {}) as Record<string, unknown>;
    const setTenant = set.tenant;
    const unset = (update.$unset ?? {}) as Record<string, unknown>;

    if (directTenant !== undefined || setTenant !== undefined || unset.tenant !== undefined) {
      next(new Error('Tenant ownership cannot be changed.'));
      return;
    }

    
    
    this.where({ tenant: new Types.ObjectId(tenantId) });
    next();
  });

  const scopeUpdateQuery = function (this: Query<unknown, unknown>, next: (err?: Error) => void): void {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      next(new Error('Tenant context is required to update this tenant-scoped document.'));
      return;
    }
    const update = this.getUpdate() as Record<string, unknown>;
    const directTenant = update.tenant;
    const set = (update.$set ?? {}) as Record<string, unknown>;
    const setTenant = set.tenant;
    const unset = (update.$unset ?? {}) as Record<string, unknown>;
    if (directTenant !== undefined || setTenant !== undefined || unset.tenant !== undefined) {
      next(new Error('Tenant ownership cannot be changed.'));
      return;
    }
    this.where({ tenant: new Types.ObjectId(tenantId) });
    next();
  };

  schema.pre('updateOne', scopeUpdateQuery);
  schema.pre('updateMany', scopeUpdateQuery);

  schema.pre(/^find/, function (next) {
    const tenantId = getCurrentTenantId();
    if (tenantId) {
      (this as Query<unknown, unknown>).where({ tenant: new Types.ObjectId(tenantId) });
    }
    next();
  });

  schema.pre('aggregate', function (next) {
    const tenantId = getCurrentTenantId();
    if (tenantId) {
      (this as Aggregate<unknown[]>).pipeline().unshift({ $match: { tenant: new Types.ObjectId(tenantId) } });
    }
    next();
  });

  schema.pre('countDocuments', function (next) {
    const tenantId = getCurrentTenantId();
    if (tenantId) {
      this.where({ tenant: new Types.ObjectId(tenantId) });
    }
    next();
  });
}
