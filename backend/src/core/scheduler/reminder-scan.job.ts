import { contractService } from '../../modules/contracts/contract.service';
import { obligationService } from '../../modules/obligations/obligation.service';
import { workflowService } from '../../modules/workflow/workflow.service';
import { signatureService } from '../../modules/signature/signature.service';
import { logger } from '../utils/logger';

const EXPIRY_LOOKAHEAD_DAYS = 30;
const OBLIGATION_LOOKAHEAD_DAYS = 7;
const MISSING_SIGNATURE_LOOKBACK_DAYS = 3;

export async function runReminderScan(): Promise<{
  expiring: number;
  activated: number;
  expired: number;
  obligationsDue: number;
  obligationsOverdue: number;
  escalated: number;
  missingSignaturesNotified: number;
}> {
  logger.info('Reminder scan starting');

  
  
  
  
  
  
  
  
  const expiring = await contractService.sweepExpiringContracts(EXPIRY_LOOKAHEAD_DAYS);

  
  
  
  
  
  
  const { activated, expired } = await contractService.syncLifecycleStatuses();

  const obligationsDue = await obligationService.sweepDueSoon(OBLIGATION_LOOKAHEAD_DAYS);
  const obligationsOverdue = await obligationService.sweepOverdue();

  const escalatedCount = await workflowService.autoEscalateOverdue();

  
  
  
  
  
  
  const missingSignaturesNotified = await signatureService.sweepMissingSignatures(MISSING_SIGNATURE_LOOKBACK_DAYS);

  const result = {
    expiring,
    activated,
    expired,
    obligationsDue,
    obligationsOverdue,
    escalated: escalatedCount,
    missingSignaturesNotified,
  };

  logger.info('Reminder scan complete', result);
  return result;
}
