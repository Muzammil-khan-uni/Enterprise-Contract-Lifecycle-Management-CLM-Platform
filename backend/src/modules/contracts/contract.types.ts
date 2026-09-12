export enum ContractType {
  VENDOR = 'Vendor',
  EMPLOYMENT = 'Employment',
  CUSTOMER = 'Customer',
  PARTNERSHIP = 'Partnership',
  SERVICE = 'Service',
}

export enum ContractStatus {
  DRAFT = 'Draft',
  IN_REVIEW = 'InReview',
  PENDING_APPROVAL = 'PendingApproval',
  APPROVED = 'Approved',
  PENDING_SIGNATURE = 'PendingSignature',
  SIGNED = 'Signed',
  ACTIVE = 'Active',
  EXPIRED = 'Expired',
  TERMINATED = 'Terminated',
  RENEWED = 'Renewed',
  ARCHIVED = 'Archived',
}

export const EDITABLE_STATUSES: ContractStatus[] = [ContractStatus.DRAFT, ContractStatus.IN_REVIEW];

export enum PartyType {
  INTERNAL = 'Internal',
  VENDOR = 'Vendor',
  CUSTOMER = 'Customer',
}

export interface ContractParty {
  partyType: PartyType;
  refId?: string;
  name: string;
  role: string;
}
