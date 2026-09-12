import { ContractModel } from '../contracts/contract.model';
import { ApprovalWorkflowModel } from '../workflow/workflow.model';
import { ObligationModel } from '../obligations/obligation.model';
import { cached, tenantCacheKey } from './dashboard.cache.util';
import { getCurrentTenantId } from '../../core/tenancy/tenant-context';
import { AppError } from '../../core/errors/AppError';

const CACHE_TTL_SECONDS = 60;
const EXPIRY_LOOKAHEAD_DAYS = 30;

function requireTenantId(): string {
  const tenantId = getCurrentTenantId();
  if (!tenantId) {
    throw AppError.internal('Dashboard request has no tenant context — was auth.middleware.ts bypassed for this route?');
  }
  return tenantId;
}

export const dashboardService = {
  

  async getSummary() {
    const tenantId = requireTenantId();

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const activeContracts = await ContractModel.countDocuments({
      status: { $in: ['Signed', 'Active'] },
      effectiveDate: { $ne: null, $lte: new Date() },
      $or: [{ expiryDate: null }, { expiryDate: { $gt: new Date() } }],
    });

    const rest = await cached(tenantCacheKey(tenantId, 'summary'), CACHE_TTL_SECONDS, async () => {
      const expiryLookahead = new Date();
      expiryLookahead.setDate(expiryLookahead.getDate() + EXPIRY_LOOKAHEAD_DAYS);

      const [expiringContracts, pendingApprovals, complianceStatus, valueByType] = await Promise.all([
        ContractModel.countDocuments({
          expiryDate: { $gte: new Date(), $lte: expiryLookahead },
          status: { $nin: ['Archived', 'Terminated', 'Expired'] },
        }),
        ApprovalWorkflowModel.countDocuments({ status: 'InProgress' }),
        ObligationModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        ContractModel.aggregate([
          { $match: { contractValue: { $ne: null } } },
          { $group: { _id: '$contractType', totalValue: { $sum: '$contractValue' }, count: { $sum: 1 } } },
        ]),
      ]);

      return {
        expiringContracts,
        pendingApprovals,
        complianceStatus: complianceStatus.map((row) => ({ status: row._id, count: row.count })),
        valueByContractType: valueByType.map((row) => ({
          contractType: row._id,
          totalValue: row.totalValue,
          count: row.count,
        })),
      };
    });

    return { activeContracts, ...rest };
  },

  async getExpiringContracts() {
    const tenantId = requireTenantId();
    return cached(tenantCacheKey(tenantId, 'expiring'), CACHE_TTL_SECONDS, async () => {
      const lookahead = new Date();
      lookahead.setDate(lookahead.getDate() + EXPIRY_LOOKAHEAD_DAYS);

      return ContractModel.find({
        expiryDate: { $gte: new Date(), $lte: lookahead },
        status: { $nin: ['Archived', 'Terminated', 'Expired'] },
      })
        .select('title contractNumber expiryDate status businessUnit')
        .sort({ expiryDate: 1 })
        .limit(100)
        .lean()
        .exec();
    });
  },

  async getByDepartment() {
    const tenantId = requireTenantId();
    return cached(tenantCacheKey(tenantId, 'by-department'), CACHE_TTL_SECONDS, async () => {
      return ContractModel.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } },
        { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, departmentId: '$_id', departmentName: '$department.name', count: 1 } },
        { $sort: { count: -1 } },
      ]);
    });
  },

  async getByVendor() {
    const tenantId = requireTenantId();
    return cached(tenantCacheKey(tenantId, 'by-vendor'), CACHE_TTL_SECONDS, async () => {
      return ContractModel.aggregate([
        { $unwind: '$parties' },
        { $match: { 'parties.partyType': 'Vendor' } },
        { $group: { _id: '$parties.name', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
        { $project: { _id: 0, vendorName: '$_id', count: 1 } },
      ]);
    });
  },
};
