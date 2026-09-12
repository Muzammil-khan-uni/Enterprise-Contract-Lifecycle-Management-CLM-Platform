import { Schema, model, Document, Types } from 'mongoose';
import { ApprovalLevel, StepStatus, WorkflowStatus } from './workflow.types';
import { tenantScopePlugin } from '../../core/tenancy/tenant-scope.plugin';
import { realtimeBroadcastPlugin } from '../../core/realtime/realtime-broadcast.plugin';

export interface ApprovalStep {
  level: ApprovalLevel;
  status: StepStatus;
  approver: Types.ObjectId | null; 
  actionedAt: Date | null;
  comments: string | null;
  escalatedTo: Types.ObjectId | null;
  
  
  
  
  
  
  
  
  
  
  
  
  isEscalated: boolean;
}

export interface IApprovalWorkflow extends Document {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  contract: Types.ObjectId;
  steps: ApprovalStep[];
  currentStepIndex: number;
  status: WorkflowStatus;
  slaDeadline: Date | null;
  submittedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const stepSchema = new Schema<ApprovalStep>(
  {
    level: { type: String, enum: Object.values(ApprovalLevel), required: true },
    status: { type: String, enum: Object.values(StepStatus), default: StepStatus.PENDING },
    approver: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    actionedAt: { type: Date, default: null },
    comments: { type: String, default: null },
    escalatedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isEscalated: { type: Boolean, default: false },
  },
  { _id: false }
);

const workflowSchema = new Schema<IApprovalWorkflow>(
  {
    contract: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    steps: { type: [stepSchema], required: true },
    currentStepIndex: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(WorkflowStatus), default: WorkflowStatus.IN_PROGRESS, index: true },
    slaDeadline: { type: Date, default: null },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

workflowSchema.index({ status: 1, slaDeadline: 1 });

workflowSchema.plugin(tenantScopePlugin);
workflowSchema.plugin(realtimeBroadcastPlugin);

export const ApprovalWorkflowModel = model<IApprovalWorkflow>('ApprovalWorkflow', workflowSchema);
