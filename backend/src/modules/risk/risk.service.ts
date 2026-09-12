import { ContractModel } from '../contracts/contract.model';
import { ObligationModel } from '../obligations/obligation.model';
import { ApprovalWorkflowModel } from '../workflow/workflow.model';
import { VendorModel } from '../vendors/vendor.model';
import { ContractStatus } from '../contracts/contract.types';
import { computeRiskScore } from './risk-scoring.util';
import { cached } from '../dashboard/dashboard.cache.util';
import { getCurrentTenantId } from '../../core/tenancy/tenant-context';
import { AppError } from '../../core/errors/AppError';
import { RiskScoreResult } from './risk.types';

const CANDIDATE_LIMIT = 300; 
const CACHE_TTL_SECONDS = 300; 

const NON_TERMINAL_STATUSES = [
  ContractStatus.DRAFT,
  ContractStatus.IN_REVIEW,
  ContractStatus.PENDING_APPROVAL,
  ContractStatus.APPROVED,
  ContractStatus.PENDING_SIGNATURE,
  ContractStatus.SIGNED,
  ContractStatus.ACTIVE,
];

export interface ScoredContract {
  contractId: string;
  title: string;
  contractNumber: string;
  status: string;
  risk: RiskScoreResult;
}

export const riskService = {
  async getTopRiskContracts(limit = 20): Promise<ScoredContract[]> {
    
    
    
    
    
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw AppError.internal('Risk dashboard request has no tenant context — was auth.middleware.ts bypassed for this route?');
    }
    return cached(`risk:${tenantId}:top:${limit}`, CACHE_TTL_SECONDS, async () => {
      const candidates = await ContractModel.find({ status: { $in: NON_TERMINAL_STATUSES } })
        .select('title contractNumber status expiryDate contractValue activeWorkflow parties')
        .sort({ expiryDate: 1 })
        .limit(CANDIDATE_LIMIT)
        .lean()
        .exec();

      if (candidates.length === 0) return [];

      const candidateIds = candidates.map((c) => c._id);

      const [overdueRows, breachedWorkflows, vendors] = await Promise.all([
        ObligationModel.aggregate([
          { $match: { contract: { $in: candidateIds }, status: 'Overdue' } },
          { $group: { _id: '$contract', count: { $sum: 1 } } },
        ]),
        ApprovalWorkflowModel.find({
          contract: { $in: candidateIds },
          status: 'InProgress',
          slaDeadline: { $lt: new Date() },
        })
          .select('contract')
          .lean()
          .exec(),
        VendorModel.find({}).select('name riskRating').lean().exec(),
      ]);

      const overdueByContract = new Map<string, number>(
        overdueRows.map((row) => [row._id.toString(), row.count as number])
      );
      const breachedContractIds = new Set(breachedWorkflows.map((w) => w.contract.toString()));
      const vendorRiskByName = new Map(vendors.map((v) => [v.name, v.riskRating]));

      const now = Date.now();
      const scored: ScoredContract[] = candidates.map((contract) => {
        const daysToExpiry = contract.expiryDate
          ? Math.floor((new Date(contract.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24))
          : null;

        
        const vendorParties = (contract.parties ?? []).filter((p) => p.partyType === 'Vendor');
        const vendorRatings = vendorParties
          .map((p) => vendorRiskByName.get(p.name))
          .filter((r): r is 'Low' | 'Medium' | 'High' => !!r);
        const worstVendorRating = vendorRatings.includes('High')
          ? 'High'
          : vendorRatings.includes('Medium')
            ? 'Medium'
            : vendorRatings.includes('Low')
              ? 'Low'
              : null;

        const risk = computeRiskScore({
          overdueObligations: overdueByContract.get(contract._id.toString()) ?? 0,
          daysToExpiry,
          contractValue: contract.contractValue,
          workflowSlaBreached: contract.activeWorkflow ? breachedContractIds.has(contract.activeWorkflow.toString()) : false,
          vendorRiskRating: worstVendorRating,
        });

        return {
          contractId: contract._id.toString(),
          title: contract.title,
          contractNumber: contract.contractNumber,
          status: contract.status,
          risk,
        };
      });

      return scored.sort((a, b) => b.risk.score - a.risk.score).slice(0, limit);
    });
  },
};
