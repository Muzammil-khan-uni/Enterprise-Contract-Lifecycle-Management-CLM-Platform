import { signatureRepository } from './signature.repository';
import { signatureProvider } from './signature.provider';
import { contractRepository } from '../contracts/contract.repository';
import { versionRepository } from '../contract-versions/version.repository';
import { renderContractPdf } from '../contracts/contract-document.util';
import { SignerType, SignatureStatus } from './signature.types';
import { ContractStatus } from '../contracts/contract.types';
import { AppError } from '../../core/errors/AppError';
import { eventBus } from '../../core/events/event-bus';
import { DomainEvent } from '../../core/events/event-types';
import { logger } from '../../core/utils/logger';
import { runWithTenant } from '../../core/tenancy/tenant-context';

interface SignerInput {
  signerType: SignerType;
  userId?: string;
  name: string;
  email: string;
}

export const signatureService = {
  

  async initiateSignature(contractId: string, signers: SignerInput[]) {
    const contract = await contractRepository.findById(contractId);
    if (!contract) throw AppError.notFound('Contract not found');

    if (contract.status !== ContractStatus.APPROVED) {
      throw AppError.conflict(
        `Contract must be Approved before signature can be initiated (currently ${contract.status})`
      );
    }

    const version = contract.currentVersion ? await versionRepository.findById(contract.currentVersion.toString()) : null;
    const documentBuffer = await renderContractPdf(contract, version);
    const documentFileName = `${contract.contractNumber}.pdf`;
    const subject = `Signature requested: ${contract.title} (${contract.contractNumber})`;

    const signatures = [];
    for (const signer of signers) {
      const signature = await signatureRepository.create({
        contract: contract._id,
        signerType: signer.signerType,
        signer: signer.userId ? (signer.userId as never) : null,
        externalSignerName: signer.signerType === SignerType.EXTERNAL ? signer.name : null,
        externalSignerEmail: signer.signerType === SignerType.EXTERNAL ? signer.email : null,
        signatureStatus: SignatureStatus.PENDING,
        provider: signatureProvider.name,
        auditTrail: [{ action: 'Signature request created', timestamp: new Date(), actor: 'system' }],
      });

      const { providerReferenceId } = await signatureProvider.requestSignature({
        contractId,
        signatureId: signature._id.toString(),
        signerName: signer.name,
        signerEmail: signer.email,
        documentBuffer,
        documentFileName,
        subject,
      });
      signature.providerReferenceId = providerReferenceId;
      signature.auditTrail.push({
        action: `Signature request sent via ${signatureProvider.name}`,
        timestamp: new Date(),
        actor: 'system',
      });
      await signature.save();

      signatures.push(signature);
    }

    contract.status = ContractStatus.PENDING_SIGNATURE;
    await contract.save();

    return signatures;
  },

  

  async handleProviderWebhookEvent(event: { providerReferenceId: string; status: 'signed' | 'declined' | 'voided' | 'ignored'; signedAt: Date | null }) {
    if (event.status === 'ignored') {
      return null;
    }

    const signature = await signatureRepository.findByProviderReferenceId(event.providerReferenceId);
    if (!signature) {
      logger.error('Received a provider webhook for an unknown signature reference — ignoring', {
        providerReferenceId: event.providerReferenceId,
      });
      return null;
    }

    if (signature.signatureStatus !== SignatureStatus.PENDING) {
      
      
      
      
      return signature;
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const contract = await contractRepository.findById(signature.contract.toString());
    if (!contract) {
      logger.warn('Signature webhook references a contract that no longer exists — recording status without a live broadcast', {
        providerReferenceId: event.providerReferenceId,
        contractId: signature.contract.toString(),
      });
    }
    const tenantId = contract?.tenant.toString();

    const actor = signature.externalSignerEmail ?? signature.signer?.toString() ?? 'external signer';

    if (event.status === 'signed') {
      signature.signatureStatus = SignatureStatus.SIGNED;
      signature.signedAt = event.signedAt ?? new Date();
      signature.auditTrail.push({ action: 'Signed (confirmed by provider webhook)', timestamp: signature.signedAt, actor });
    } else if (event.status === 'declined') {
      signature.signatureStatus = SignatureStatus.DECLINED;
      signature.auditTrail.push({ action: 'Declined (confirmed by provider webhook)', timestamp: new Date(), actor });
    } else if (event.status === 'voided') {
      signature.signatureStatus = SignatureStatus.VOIDED;
      signature.auditTrail.push({ action: 'Voided/expired (confirmed by provider webhook)', timestamp: new Date(), actor });
    }
    await (tenantId ? runWithTenant(tenantId, () => signature.save()) : signature.save());

    const contractId = signature.contract.toString();

    if (event.status === 'signed') {
      const allSigned = await signatureRepository.allSignedForContract(contractId);
      if (allSigned && contract && tenantId) {
        contract.status = ContractStatus.SIGNED;
        await runWithTenant(tenantId, () => contract.save());
      }

      eventBus.emitEvent(DomainEvent.SIGNATURE_COMPLETED, {
        contractId,
        signatureId: signature._id.toString(),
      });
    }

    return signature;
  },

  async getAuditTrail(signatureId: string) {
    const signature = await signatureRepository.findById(signatureId);
    if (!signature) throw AppError.notFound('Signature record not found');
    return signature.auditTrail;
  },

  async listForContract(contractId: string) {
    return signatureRepository.listForContract(contractId);
  },

  
  async listMine(userId: string) {
    return signatureRepository.listForSigner(userId);
  },

  

  async sweepMissingSignatures(days = 3) {
    const pending = await signatureRepository.findPendingOlderThanDays(days);
    let notifiedCount = 0;

    for (const signature of pending) {
      if (signature.signerType === SignerType.INTERNAL && signature.signer) {
        eventBus.emitEvent(DomainEvent.SIGNATURE_REMINDER, {
          contractId: signature.contract.toString(),
          signatureId: signature._id.toString(),
          recipientId: signature.signer.toString(),
        });
        notifiedCount += 1;
      }
    }

    return notifiedCount;
  },
};
