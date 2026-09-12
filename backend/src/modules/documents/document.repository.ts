import { BaseRepository } from '../../core/base/BaseRepository';
import { DocumentModel, IDocumentFile } from './document.model';

class DocumentRepository extends BaseRepository<IDocumentFile> {
  constructor() {
    super(DocumentModel);
  }

  async listForContract(contractId: string) {
    return DocumentModel.find({ contract: contractId }).sort({ createdAt: -1 }).exec();
  }
}

export const documentRepository = new DocumentRepository();
