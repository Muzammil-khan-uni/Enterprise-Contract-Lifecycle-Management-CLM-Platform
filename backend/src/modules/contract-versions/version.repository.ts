import { BaseRepository } from '../../core/base/BaseRepository';
import { ContractVersionModel, IContractVersion } from './version.model';

class VersionRepository extends BaseRepository<IContractVersion> {
  constructor() {
    super(ContractVersionModel);
  }

  async listForContract(contractId: string) {
    return ContractVersionModel.find({ contract: contractId }).sort({ versionNumber: -1 }).exec();
  }

  async getLatest(contractId: string) {
    return ContractVersionModel.findOne({ contract: contractId }).sort({ versionNumber: -1 }).exec();
  }

  async getByVersionNumber(contractId: string, versionNumber: number) {
    return ContractVersionModel.findOne({ contract: contractId, versionNumber }).exec();
  }
}

export const versionRepository = new VersionRepository();
