import { Router } from 'express';
import { contractController } from './contract.controller';
import { contractRepository } from './contract.repository';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { requirePermission } from '../../core/middleware/rbac.middleware';
import { validate } from '../../core/middleware/validate.middleware';
import { auditLog } from '../../core/middleware/audit-log.middleware';
import { loadResourceBusinessUnit } from '../../core/middleware/load-resource-scope.middleware';
import { createContractSchema, updateContractSchema, listContractsSchema, renewContractSchema } from './contract.validation';
import { Permission } from '../users/user.types';
import { getParam } from '../../core/utils/params';
import versionRoutes from '../contract-versions/version.routes';
import { contractScopedRouter as workflowContractScopedRoutes } from '../workflow/workflow.routes';
import { contractScopedRouter as signatureContractScopedRoutes } from '../signature/signature.routes';
import { contractScopedRouter as obligationContractScopedRoutes } from '../obligations/obligation.routes';
import { contractScopedRouter as documentContractScopedRoutes } from '../documents/document.routes';

const resolveContractBusinessUnit = async (req: import('express').Request) => {
  const contract = await contractRepository.findById(getParam(req, 'id'));
  return contract?.businessUnit ? contract.businessUnit.toString() : null;
};

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission(Permission.CONTRACT_READ), validate(listContractsSchema), contractController.list);
router.post(
  '/',
  requirePermission(Permission.CONTRACT_CREATE),
  validate(createContractSchema),
  auditLog('Contract'),
  contractController.create
);

router.get('/renewals', requirePermission(Permission.CONTRACT_READ), contractController.renewalCandidates);
router.get('/:id', requirePermission(Permission.CONTRACT_READ), contractController.getById);
router.patch(
  '/:id',
  loadResourceBusinessUnit(resolveContractBusinessUnit),
  requirePermission(Permission.CONTRACT_UPDATE, { scopeToOwnBusinessUnit: true }),
  validate(updateContractSchema),
  auditLog('Contract'),
  contractController.update
);
router.delete(
  '/:id',
  loadResourceBusinessUnit(resolveContractBusinessUnit),
  requirePermission(Permission.CONTRACT_DELETE, { scopeToOwnBusinessUnit: true }),
  auditLog('Contract'),
  contractController.archive
);

router.post(
  '/:id/renew',
  loadResourceBusinessUnit(resolveContractBusinessUnit),
  requirePermission(Permission.CONTRACT_UPDATE, { scopeToOwnBusinessUnit: true }),
  validate(renewContractSchema),
  auditLog('Contract'),
  contractController.renew
);

router.use('/:contractId/versions', versionRoutes);
router.use('/:contractId/workflow', workflowContractScopedRoutes);
router.use('/:contractId/signature', signatureContractScopedRoutes);
router.use('/:contractId/obligations', obligationContractScopedRoutes);
router.use('/:contractId/documents', documentContractScopedRoutes);

export default router;
