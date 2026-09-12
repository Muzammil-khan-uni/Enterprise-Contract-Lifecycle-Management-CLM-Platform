import { BaseRepository } from '../../core/base/BaseRepository';
import { ObligationModel, IObligation } from './obligation.model';
import { ObligationStatus } from './obligation.types';

class ObligationRepository extends BaseRepository<IObligation> {
  constructor() {
    super(ObligationModel);
  }

  async listForContract(contractId: string) {
    return ObligationModel.find({ contract: contractId }).sort({ dueDate: 1 }).exec();
  }

  

  async listForAssignee(userId: string, status?: ObligationStatus) {
    const filter: Record<string, unknown> = { assignedTo: userId };
    if (status) filter.status = status;
    return ObligationModel.find(filter)
      .sort({ dueDate: 1 })
      .limit(200)
      .populate('contract', 'title contractNumber')
      .exec();
  }

  

  async findDueWithinDays(days: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return ObligationModel.find({
      dueDate: { $lte: cutoff },
      status: ObligationStatus.PENDING,
    })
      .limit(500)
      .exec();
  }

  
  
  
  
  
  
  
  
  
  
}

export const obligationRepository = new ObligationRepository();
