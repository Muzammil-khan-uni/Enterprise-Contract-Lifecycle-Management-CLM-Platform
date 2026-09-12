import { BaseRepository } from '../../core/base/BaseRepository';
import { SignatureModel, ISignature } from './signature.model';
import { SignatureStatus } from './signature.types';

class SignatureRepository extends BaseRepository<ISignature> {
  constructor() {
    super(SignatureModel);
  }

  async listForContract(contractId: string) {
    return SignatureModel.find({ contract: contractId }).sort({ createdAt: 1 }).exec();
  }

  

  async listForSigner(userId: string) {
    return SignatureModel.find({ signer: userId })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('contract', 'title contractNumber status')
      .exec();
  }

  

  async findByProviderReferenceId(providerReferenceId: string) {
    return SignatureModel.findOne({ providerReferenceId }).exec();
  }

  

  async findPendingOlderThanDays(days: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return SignatureModel.find({
      signatureStatus: SignatureStatus.PENDING,
      createdAt: { $lte: cutoff },
    })
      .limit(500)
      .exec();
  }

  async allSignedForContract(contractId: string): Promise<boolean> {
    const pendingCount = await SignatureModel.countDocuments({
      contract: contractId,
      signatureStatus: { $ne: 'Signed' },
    }).exec();
    return pendingCount === 0;
  }
}

export const signatureRepository = new SignatureRepository();
