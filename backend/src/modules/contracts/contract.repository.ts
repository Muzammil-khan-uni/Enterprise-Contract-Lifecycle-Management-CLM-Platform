import { FilterQuery } from 'mongoose';
import { BaseRepository } from '../../core/base/BaseRepository';
import { ContractModel, IContract } from './contract.model';
import { buildCursorQuery, resolveLimit } from '../../core/utils/pagination';
import { ContractStatus, ContractType } from './contract.types';

export interface ContractListFilters {
  status?: ContractStatus;
  contractType?: ContractType;
  businessUnit?: string;
  department?: string;
  search?: string;
  cursor?: string;
  limit?: number;
}

class ContractRepository extends BaseRepository<IContract> {
  constructor() {
    super(ContractModel);
  }

  async findByContractNumber(contractNumber: string) {
    return ContractModel.findOne({ contractNumber }).exec();
  }

  

  async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return ContractModel.find({ _id: { $in: ids } }).exec();
  }

  

  async listContracts(filters: ContractListFilters) {
    const query: FilterQuery<IContract> = { ...buildCursorQuery(filters.cursor) };

    if (filters.status) query.status = filters.status;
    if (filters.contractType) query.contractType = filters.contractType;
    if (filters.businessUnit) query.businessUnit = filters.businessUnit;
    if (filters.department) query.department = filters.department;
    if (filters.search) query.$text = { $search: filters.search };

    const limit = resolveLimit(filters.limit);

    const results = await ContractModel.find(query)
      .sort({ _id: 1 })
      .limit(limit + 1) 
      .exec();

    const hasNextPage = results.length > limit;
    const items = hasNextPage ? results.slice(0, limit) : results;
    const nextCursor = hasNextPage ? items[items.length - 1]._id.toString() : null;

    return { items, nextCursor, hasNextPage };
  }

  async findExpiringWithinDays(days: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return ContractModel.find({
      expiryDate: { $lte: cutoff, $gte: new Date() },
      status: { $nin: [ContractStatus.ARCHIVED, ContractStatus.TERMINATED, ContractStatus.EXPIRED] },
    })
      .limit(500)
      .exec();
  }

  

  async findSignedPastEffectiveDate() {
    return ContractModel.find({
      status: ContractStatus.SIGNED,
      effectiveDate: { $ne: null, $lte: new Date() },
    })
      .limit(500)
      .exec();
  }

  

  async findActivePastExpiryDate() {
    return ContractModel.find({
      status: ContractStatus.ACTIVE,
      expiryDate: { $ne: null, $lte: new Date() },
    })
      .limit(500)
      .exec();
  }

  

  async findRenewalCandidates(limit = 200) {
    return ContractModel.find({
      status: { $in: [ContractStatus.ACTIVE, ContractStatus.EXPIRED] },
      renewedTo: null,
    })
      .sort({ expiryDate: 1 })
      .limit(limit)
      .exec();
  }
}

export const contractRepository = new ContractRepository();
