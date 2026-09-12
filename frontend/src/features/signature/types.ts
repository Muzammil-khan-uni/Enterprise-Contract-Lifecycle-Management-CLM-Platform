export type SignerType = 'Internal' | 'External';
export type SignatureStatus = 'Pending' | 'Signed' | 'Declined' | 'Voided';

export interface SignatureAuditEntry {
  action: string;
  timestamp: string;
  actor: string;
}

export interface Signature {
  _id: string;
  
  
  
  
  
  
  contract: string | { _id: string; title: string; contractNumber: string; status: string };
  signerType: SignerType;
  signer: string | null;
  externalSignerName: string | null;
  externalSignerEmail: string | null;
  signatureStatus: SignatureStatus;
  signedAt: string | null;
  provider: string;
  auditTrail: SignatureAuditEntry[];
}
