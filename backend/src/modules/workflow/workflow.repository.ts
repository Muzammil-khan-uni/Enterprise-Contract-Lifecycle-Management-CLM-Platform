import { BaseRepository } from '../../core/base/BaseRepository';
import { ApprovalWorkflowModel, IApprovalWorkflow } from './workflow.model';

class WorkflowRepository extends BaseRepository<IApprovalWorkflow> {
  constructor() {
    super(ApprovalWorkflowModel);
  }

  async findActiveForContract(contractId: string) {
    return ApprovalWorkflowModel.findOne({
      contract: contractId,
      status: 'InProgress',
    }).exec();
  }

  async listForContract(contractId: string) {
    return ApprovalWorkflowModel.find({ contract: contractId }).sort({ createdAt: -1 }).exec();
  }

  

  async findQueueForLevels(levels: string[]) {
    return ApprovalWorkflowModel.find({
      status: 'InProgress',
      $expr: { $in: [{ $arrayElemAt: ['$steps.level', '$currentStepIndex'] }, levels] },
    })
      .populate('contract', 'title contractNumber status businessUnit')
      .sort({ slaDeadline: 1 })
      .limit(200)
      .exec();
  }

  

  async findOverdueInProgress() {
    return ApprovalWorkflowModel.find({
      status: 'InProgress',
      slaDeadline: { $lt: new Date() },
    })
      .limit(500)
      .exec();
  }
}

export const workflowRepository = new WorkflowRepository();
