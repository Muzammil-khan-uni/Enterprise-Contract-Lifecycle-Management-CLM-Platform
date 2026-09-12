import { workflowRepository } from './workflow.repository';
import { contractRepository } from '../contracts/contract.repository';
import { buildInitialSteps, assertCanAct, applyApproval, applyRejection } from './workflow.state-machine';
import { WorkflowStatus, StepStatus, APPROVAL_LEVEL_PERMISSION } from './workflow.types';
import { ContractStatus } from '../contracts/contract.types';
import { AppError } from '../../core/errors/AppError';
import { eventBus } from '../../core/events/event-bus';
import { DomainEvent } from '../../core/events/event-types';
import { Permission } from '../users/user.types';
import { runWithTenant } from '../../core/tenancy/tenant-context';

const DEFAULT_SLA_DAYS = 5;

export const workflowService = {
  

  async submitForApproval(contractId: string, submittedBy: string) {
    const contract = await contractRepository.findById(contractId);
    if (!contract) throw AppError.notFound('Contract not found');

    if (![ContractStatus.DRAFT, ContractStatus.IN_REVIEW].includes(contract.status)) {
      throw AppError.conflict(`Contract in status "${contract.status}" cannot be submitted for approval`);
    }

    const existingActive = await workflowRepository.findActiveForContract(contractId);
    if (existingActive) {
      throw AppError.conflict('This contract already has an approval workflow in progress');
    }

    const slaDeadline = new Date();
    slaDeadline.setDate(slaDeadline.getDate() + DEFAULT_SLA_DAYS);

    const workflow = await workflowRepository.create({
      contract: contract._id,
      steps: buildInitialSteps(),
      currentStepIndex: 0,
      status: WorkflowStatus.IN_PROGRESS,
      slaDeadline,
      submittedBy: submittedBy as never,
    });

    contract.status = ContractStatus.PENDING_APPROVAL;
    contract.activeWorkflow = workflow._id;
    await contract.save();

    eventBus.emitEvent(DomainEvent.APPROVAL_SUBMITTED, {
      workflowId: workflow._id.toString(),
      contractId: contractId,
    });

    return workflow;
  },

  

  async approveStep(
    workflowId: string,
    actorId: string,
    actorPermissions: Permission[],
    actorBusinessUnit: string | null,
    comments?: string
  ) {
    const workflow = await workflowRepository.findById(workflowId);
    if (!workflow) throw AppError.notFound('Workflow not found');

    const step = assertCanAct(workflow.steps, workflow.currentStepIndex, workflow.status);
    const requiredPermission = APPROVAL_LEVEL_PERMISSION[step.level];
    if (!actorPermissions.includes(requiredPermission)) {
      throw AppError.forbidden(`You do not have permission to approve the ${step.level} step`);
    }

    const contract = await contractRepository.findById(workflow.contract.toString());
    if (!contract) throw AppError.notFound('Contract for this workflow no longer exists');

    const hasAllUnitsAccess = actorPermissions.includes(Permission.CONTRACT_READ_ALL_UNITS);
    if (!hasAllUnitsAccess && contract.businessUnit && contract.businessUnit.toString() !== actorBusinessUnit) {
      throw AppError.forbidden('This contract is outside your business unit');
    }

    step.status = StepStatus.APPROVED;
    step.approver = actorId as never;
    step.actionedAt = new Date();
    step.comments = comments ?? null;
    step.isEscalated = false; 

    const transition = applyApproval(workflow.steps, workflow.currentStepIndex);
    workflow.currentStepIndex = transition.nextStepIndex;
    workflow.status = transition.workflowStatus;
    await workflow.save();

    if (transition.isComplete) {
      contract.status = ContractStatus.APPROVED;
      await contract.save();
      eventBus.emitEvent(DomainEvent.APPROVAL_COMPLETED, {
        workflowId: workflow._id.toString(),
        contractId: workflow.contract.toString(),
      });
    }

    return workflow;
  },

  async rejectStep(
    workflowId: string,
    actorId: string,
    actorPermissions: Permission[],
    actorBusinessUnit: string | null,
    comments?: string
  ) {
    const workflow = await workflowRepository.findById(workflowId);
    if (!workflow) throw AppError.notFound('Workflow not found');

    const step = assertCanAct(workflow.steps, workflow.currentStepIndex, workflow.status);
    const requiredPermission = APPROVAL_LEVEL_PERMISSION[step.level];
    if (!actorPermissions.includes(requiredPermission)) {
      throw AppError.forbidden(`You do not have permission to reject the ${step.level} step`);
    }

    const contract = await contractRepository.findById(workflow.contract.toString());
    if (!contract) throw AppError.notFound('Contract for this workflow no longer exists');

    const hasAllUnitsAccess = actorPermissions.includes(Permission.CONTRACT_READ_ALL_UNITS);
    if (!hasAllUnitsAccess && contract.businessUnit && contract.businessUnit.toString() !== actorBusinessUnit) {
      throw AppError.forbidden('This contract is outside your business unit');
    }

    step.status = StepStatus.REJECTED;
    step.approver = actorId as never;
    step.actionedAt = new Date();
    step.comments = comments ?? null;
    step.isEscalated = false; 

    const transition = applyRejection();
    workflow.status = transition.workflowStatus;
    await workflow.save();

    
    
    
    contract.status = ContractStatus.DRAFT;
    contract.activeWorkflow = null;
    await contract.save();

    eventBus.emitEvent(DomainEvent.APPROVAL_REJECTED, {
      workflowId: workflow._id.toString(),
      contractId: workflow.contract.toString(),
      reason: comments ?? 'No reason provided',
    });

    return workflow;
  },

  

  async escalateStep(
    workflowId: string,
    actorPermissions: Permission[],
    actorBusinessUnit: string | null,
    escalateTo: string,
    reason?: string
  ) {
    const workflow = await workflowRepository.findById(workflowId);
    if (!workflow) throw AppError.notFound('Workflow not found');

    const step = assertCanAct(workflow.steps, workflow.currentStepIndex, workflow.status);
    const requiredPermission = APPROVAL_LEVEL_PERMISSION[step.level];
    if (!actorPermissions.includes(requiredPermission)) {
      throw AppError.forbidden(`You do not have permission to escalate the ${step.level} step`);
    }

    const contract = await contractRepository.findById(workflow.contract.toString());
    if (!contract) throw AppError.notFound('Contract for this workflow no longer exists');

    const hasAllUnitsAccess = actorPermissions.includes(Permission.CONTRACT_READ_ALL_UNITS);
    if (!hasAllUnitsAccess && contract.businessUnit && contract.businessUnit.toString() !== actorBusinessUnit) {
      throw AppError.forbidden('This contract is outside your business unit');
    }

    step.escalatedTo = escalateTo as never;
    step.comments = reason ? `Escalated: ${reason}` : 'Escalated';
    step.isEscalated = true;
    await workflow.save();

    return workflow;
  },

  async getForContract(contractId: string) {
    return workflowRepository.listForContract(contractId);
  },

  

  async getQueueForUser(actorPermissions: Permission[], actorBusinessUnit: string | null) {
    const levels = Object.entries(APPROVAL_LEVEL_PERMISSION)
      .filter(([, permission]) => actorPermissions.includes(permission))
      .map(([level]) => level);

    if (levels.length === 0) return [];

    const queue = await workflowRepository.findQueueForLevels(levels);
    const hasAllUnitsAccess = actorPermissions.includes(Permission.CONTRACT_READ_ALL_UNITS);
    if (hasAllUnitsAccess) return queue;

    return queue.filter((workflow) => {
      const contract = workflow.contract as unknown as { businessUnit?: { toString(): string } } | null;
      return !contract?.businessUnit || contract.businessUnit.toString() === actorBusinessUnit;
    });
  },

  

  async autoEscalateOverdue() {
    const overdue = await workflowRepository.findOverdueInProgress();
    let escalatedCount = 0;

    for (const workflow of overdue) {
      const step = workflow.steps[workflow.currentStepIndex];
      if (!step || step.comments?.startsWith('Auto-escalated')) continue;

      step.comments = `Auto-escalated: SLA deadline of ${workflow.slaDeadline?.toISOString()} passed`;
      step.isEscalated = true;
      
      
      
      
      
      
      await runWithTenant(workflow.tenant.toString(), () => workflow.save());
      escalatedCount += 1;

      eventBus.emitEvent(DomainEvent.WORKFLOW_SLA_BREACHED, {
        workflowId: workflow._id.toString(),
        contractId: workflow.contract.toString(),
        level: step.level,
      });
    }

    return escalatedCount;
  },
};
