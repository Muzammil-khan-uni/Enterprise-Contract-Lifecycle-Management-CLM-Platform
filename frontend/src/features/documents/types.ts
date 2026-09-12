export type DocumentType = 'Attachment' | 'SupportingDocument' | 'Amendment' | 'Policy' | 'ScannedCopy';

export interface ContractDocument {
  _id: string;
  contract: string;
  type: DocumentType;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  version: number;
  createdAt: string;
  
  
  
  
  ocrText: string | null;
}
