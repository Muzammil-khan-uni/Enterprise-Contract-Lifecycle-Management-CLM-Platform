export enum SignerType {
  INTERNAL = 'Internal',
  EXTERNAL = 'External',
}

export enum SignatureStatus {
  PENDING = 'Pending',
  SIGNED = 'Signed',
  DECLINED = 'Declined',
  VOIDED = 'Voided',
}

export enum SignatureProviderName {
  DOCUSIGN = 'docusign',
  ADOBESIGN = 'adobesign',
}

export interface SignatureAuditEntry {
  action: string;
  timestamp: Date;
  actor: string; 
}
