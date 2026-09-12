

export type ContractStatus =
  | 'Draft'
  | 'InReview'
  | 'PendingApproval'
  | 'Approved'
  | 'PendingSignature'
  | 'Signed'
  | 'Active'
  | 'Expired'
  | 'Terminated'
  | 'Renewed'
  | 'Archived';

export type ContractType = 'Vendor' | 'Employment' | 'Customer' | 'Partnership' | 'Service';

export interface ContractParty {
  partyType: 'Internal' | 'Vendor' | 'Customer';
  refId?: string;
  name: string;
  role: string;
}

export interface Contract {
  _id: string;
  contractNumber: string;
  title: string;
  contractType: ContractType;
  department: string;
  businessUnit: string;
  parties: ContractParty[];
  effectiveDate: string | null;
  expiryDate: string | null;
  status: ContractStatus;
  contractValue: number | null;
  currency: string | null;
  tags: string[];
  confidentialityLevel: 'Public' | 'Internal' | 'Confidential' | 'Restricted';
  renewedFrom: string | null;
  renewedTo: string | null;
  
  
  
  
  sourceTemplate: string | null;
  sourceTemplateVersionNumber: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContractVersion {
  _id: string;
  contract: string;
  versionNumber: number;
  content: Record<string, unknown>;
  changeSummary: string | null;
  editedBy: string;
  createdAt: string;
}

export interface ContractListFilters {
  status?: ContractStatus;
  contractType?: ContractType;
  search?: string;
  cursor?: string;
}
