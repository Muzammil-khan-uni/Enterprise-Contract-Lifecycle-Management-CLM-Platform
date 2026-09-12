

jest.mock('../../src/modules/documents/document.repository', () => ({
  documentRepository: {
    findById: jest.fn(),
    deleteById: jest.fn(),
    listForContract: jest.fn(),
  },
}));
jest.mock('../../src/modules/documents/storage.provider', () => ({
  storageProvider: { delete: jest.fn().mockResolvedValue(undefined), getDownloadUrl: jest.fn().mockReturnValue('https://cdn.example.com/signed-doc1.pdf') },
}));
jest.mock('../../src/modules/contracts/contract.repository', () => ({
  contractRepository: { findById: jest.fn() },
}));

import { documentService } from '../../src/modules/documents/document.service';
import { documentController } from '../../src/modules/documents/document.controller';
import { documentRepository } from '../../src/modules/documents/document.repository';
import { storageProvider } from '../../src/modules/documents/storage.provider';

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

describe('documentController.download', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns a short-lived signed URL when the document belongs to the contract in the URL', async () => {
    (documentRepository.findById as jest.Mock).mockResolvedValue({
      _id: 'doc1',
      contract: { toString: () => 'contract1' },
      storageUrl: 'https://cdn.example.com/doc1.pdf',
    });

    const req: any = { params: { contractId: 'contract1', id: 'doc1' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };

    await documentController.download(req, res, jest.fn());
    await flushPromises();

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: { url: 'https://cdn.example.com/signed-doc1.pdf' } })
    );
  });

  it('never returns a URL for a document belonging to a different contract', async () => {
    (documentRepository.findById as jest.Mock).mockResolvedValue({
      _id: 'doc1',
      contract: { toString: () => 'some-other-contract' },
      storageUrl: 'https://cdn.example.com/doc1.pdf',
    });

    const req: any = { params: { contractId: 'contract1', id: 'doc1' } };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    const next = jest.fn();

    await documentController.download(req, res, next);
    await flushPromises();

    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/Document not found/) }));
  });
});

describe('documentService.getForDownload', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the document when it belongs to the given contract', async () => {
    (documentRepository.findById as jest.Mock).mockResolvedValue({
      _id: 'doc1',
      contract: { toString: () => 'contract1' },
      storageUrl: 'https://cdn.example.com/doc1.pdf',
    });

    const doc = await documentService.getForDownload('contract1', 'doc1');
    expect(doc.storageUrl).toBe('https://cdn.example.com/doc1.pdf');
  });

  it('404s when the document belongs to a DIFFERENT contract than the one in the URL', async () => {
    (documentRepository.findById as jest.Mock).mockResolvedValue({
      _id: 'doc1',
      contract: { toString: () => 'some-other-contract' },
    });

    await expect(documentService.getForDownload('contract1', 'doc1')).rejects.toThrow(
      /Document not found for this contract/
    );
  });

  it('404s when the document does not exist at all', async () => {
    (documentRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(documentService.getForDownload('contract1', 'doc1')).rejects.toThrow(
      /Document not found for this contract/
    );
  });
});

describe('documentService.deleteDocument', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes when the document belongs to the given contract', async () => {
    (documentRepository.findById as jest.Mock).mockResolvedValue({
      _id: 'doc1',
      contract: { toString: () => 'contract1' },
      storageKey: 'clm/doc1',
    });
    (documentRepository.deleteById as jest.Mock).mockResolvedValue({ _id: 'doc1' });

    await documentService.deleteDocument('contract1', 'doc1');

    expect(storageProvider.delete).toHaveBeenCalledWith('clm/doc1');
    expect(documentRepository.deleteById).toHaveBeenCalledWith('doc1');
  });

  it('refuses to delete a document that belongs to a DIFFERENT contract than the one in the URL', async () => {
    (documentRepository.findById as jest.Mock).mockResolvedValue({
      _id: 'doc1',
      contract: { toString: () => 'some-other-contract' },
      storageKey: 'clm/doc1',
    });

    await expect(documentService.deleteDocument('contract1', 'doc1')).rejects.toThrow(
      /Document not found for this contract/
    );
    expect(storageProvider.delete).not.toHaveBeenCalled();
    expect(documentRepository.deleteById).not.toHaveBeenCalled();
  });
});
