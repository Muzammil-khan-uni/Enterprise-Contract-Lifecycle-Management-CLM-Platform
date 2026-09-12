/**
 * Seed script — cleans out any existing data for the "acme" tenant,
 * then creates:
 *
 *   - 1 Tenant ("Acme Corporation")
 *   - 3 Business Units, 3 Departments (1 per Business Unit)
 *   - 6 Users (one per role: Admin, LegalOfficer, FinanceOfficer,
 *     Executive, DepartmentUser, Vendor)
 *   - 3 Vendors (Low / Medium / High risk rating)
 *   - 3 Clauses (Confidentiality, Termination, Payment Terms)
 *   - 3 Templates (Vendor, Customer, Service contract types)
 *   - Contracts: exactly 1 for EVERY ContractStatus (11 total)
 *   - Obligations: exactly 1 for EVERY ObligationType (6 total)
 *
 * Tenancy handling: every tenant-scoped model is created inside
 * `runWithTenant(...)` so `tenantScopePlugin` auto-stamps `tenant` —
 * see core/tenancy/tenant-scope.plugin.ts. User is tenant-scoped
 * manually (see user.model.ts), so `tenant` is set explicitly on
 * every user. Cleanup `deleteMany` calls use an explicit `{tenant}`
 * filter since the plugin's hooks don't cover deleteMany.
 *
 * UserModel.syncIndexes() runs before any writes to drop indexes left
 * over from older versions of the schema (e.g. a stale
 * `{email, workspaces.workspace}` unique index) that would otherwise
 * reject valid inserts even though nothing in the current codebase
 * defines them.
 *
 * Idempotent: re-running wipes and reseeds only the "acme" tenant.
 *
 * Usage (from backend/):
 *   npx ts-node scripts/seed.ts
 *
 * All seeded users share the password: Password123!
 */

import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { connectRedis, redisClient } from '../src/config/redis';
import { runWithTenant } from '../src/core/tenancy/tenant-context';
import { logger } from '../src/core/utils/logger';

import { TenantModel, ITenant } from '../src/modules/tenants/tenant.model';
import { UserModel } from '../src/modules/users/user.model';
import { UserRole } from '../src/modules/users/user.types';
import { BusinessUnitModel } from '../src/modules/business-units/business-unit.model';
import { DepartmentModel } from '../src/modules/departments/department.model';
import { VendorModel } from '../src/modules/vendors/vendor.model';
import { ClauseModel } from '../src/modules/templates/clause.model';
import { TemplateModel } from '../src/modules/templates/template.model';
import { ContractModel, IContract } from '../src/modules/contracts/contract.model';
import { ContractType, ContractStatus, PartyType, ContractParty } from '../src/modules/contracts/contract.types';
import { ObligationModel } from '../src/modules/obligations/obligation.model';
import {
  ObligationType,
  ObligationStatus,
  RecurrenceInterval,
} from '../src/modules/obligations/obligation.types';

const BCRYPT_ROUNDS = 12;
const TENANT_SLUG = 'acme';
const SEED_PASSWORD = 'Password123!';

const DAY_MS = 24 * 60 * 60 * 1000;
function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * DAY_MS);
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

async function main(): Promise<void> {
  await connectDatabase();
  logger.info('Connected to MongoDB — starting seed run');

  // -------------------------------------------------------------------
  // 1. Tenant (not itself tenant-scoped — see tenant.model.ts)
  // -------------------------------------------------------------------
  await TenantModel.deleteOne({ slug: TENANT_SLUG });
  const tenant: ITenant = await TenantModel.create({
    name: 'Acme Corporation',
    slug: TENANT_SLUG,
    plan: 'Enterprise',
    isActive: true,
  });
  const tenantId = tenant._id.toString();
  logger.info(`Created tenant "${tenant.name}" (${tenantId})`);

  // Wipe any pre-existing data for this tenant so the script is safe to
  // re-run — explicit filters since deleteMany bypasses tenantScopePlugin.
  await Promise.all([
    UserModel.deleteMany({ tenant: tenant._id }),
    BusinessUnitModel.deleteMany({ tenant: tenant._id }),
    DepartmentModel.deleteMany({ tenant: tenant._id }),
    VendorModel.deleteMany({ tenant: tenant._id }),
    ClauseModel.deleteMany({ tenant: tenant._id }),
    TemplateModel.deleteMany({ tenant: tenant._id }),
    ContractModel.deleteMany({ tenant: tenant._id }),
    ObligationModel.deleteMany({ tenant: tenant._id }),
  ]);
  logger.info(`Cleared existing data for tenant "${TENANT_SLUG}"`);

  // Bring the users collection's indexes in line with the CURRENT
  // user.model.ts schema before writing anything. Real databases can
  // accumulate indexes from older versions of a schema (e.g. a prior
  // `{email, workspaces.workspace}` unique index before this model used
  // `tenant`) — those stale indexes are still enforced by MongoDB even
  // though nothing in the codebase defines them anymore, and reject
  // otherwise-valid inserts. syncIndexes() drops anything not declared
  // by the schema and (re)creates what IS declared (the `{tenant,
  // email}` unique index — see user.model.ts), so this is safe to run
  // every time and self-heals that class of mismatch.
  await UserModel.syncIndexes();

  // Everything below is tenant-scoped via tenantScopePlugin, which reads
  // the current tenant out of AsyncLocalStorage — see tenant-context.ts.
  await runWithTenant(tenantId, async () => {
    // -----------------------------------------------------------------
    // 2. Business Units (3) + Departments (1 per Business Unit = 3)
    // -----------------------------------------------------------------
    const [buEngineering, buSales, buOperations] = await BusinessUnitModel.create([
      { name: 'Engineering', code: 'ENG', parentUnit: null },
      { name: 'Sales & Marketing', code: 'SAL', parentUnit: null },
      { name: 'Operations & Finance', code: 'OPS', parentUnit: null },
    ]);
    const [deptEngineering, deptSales, deptLegalFinance] = await DepartmentModel.create([
      { name: 'Product Engineering', code: 'ENG-PRD', businessUnit: buEngineering._id, headOfDept: null },
      { name: 'Sales', code: 'SAL-SLS', businessUnit: buSales._id, headOfDept: null },
      { name: 'Legal & Finance', code: 'OPS-LGL', businessUnit: buOperations._id, headOfDept: null },
    ]);
    logger.info('Seeded 3 Business Units and 3 Departments');

    // -----------------------------------------------------------------
    // 3. Users (1 per role = 6 total)
    // -----------------------------------------------------------------
    const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_ROUNDS);

    const [admin, legalOfficer, financeOfficer, executive, deptUser, vendorUser] =
      await UserModel.create([
        {
          tenant: tenant._id,
          name: 'Sarah Chen',
          email: 'admin@acme.test',
          passwordHash,
          role: UserRole.ADMIN,
          businessUnit: buEngineering._id,
          department: deptEngineering._id,
          country: 'United States',
          bio: 'Platform administrator overseeing contract operations.',
          isActive: true,
          emailVerified: true,
        },
        {
          tenant: tenant._id,
          name: 'David Okafor',
          email: 'legal@acme.test',
          passwordHash,
          role: UserRole.LEGAL_OFFICER,
          businessUnit: buOperations._id,
          department: deptLegalFinance._id,
          country: 'United States',
          bio: 'In-house counsel handling contract review and approvals.',
          isActive: true,
          emailVerified: true,
        },
        {
          tenant: tenant._id,
          name: 'Priya Sharma',
          email: 'finance@acme.test',
          passwordHash,
          role: UserRole.FINANCE_OFFICER,
          businessUnit: buOperations._id,
          department: deptLegalFinance._id,
          country: 'India',
          bio: 'Finance officer approving contract value and payment terms.',
          isActive: true,
          emailVerified: true,
        },
        {
          tenant: tenant._id,
          name: 'Michael Torres',
          email: 'executive@acme.test',
          passwordHash,
          role: UserRole.EXECUTIVE,
          businessUnit: null,
          department: null,
          country: 'United States',
          bio: 'VP of Operations, final approver on high-value contracts.',
          isActive: true,
          emailVerified: true,
        },
        {
          tenant: tenant._id,
          name: 'James Park',
          email: 'james.park@acme.test',
          passwordHash,
          role: UserRole.DEPARTMENT_USER,
          businessUnit: buSales._id,
          department: deptSales._id,
          country: 'United States',
          bio: 'Sales manager handling customer contracts.',
          isActive: true,
          emailVerified: true,
        },
        {
          tenant: tenant._id,
          name: 'Vendor Portal Contact',
          email: 'vendor@acme.test',
          passwordHash,
          role: UserRole.VENDOR,
          businessUnit: null,
          department: null,
          country: 'United States',
          bio: 'External vendor-side portal user.',
          isActive: true,
          emailVerified: true,
        },
      ]);
    // vendorUser is seeded (the Vendor-role portal login) but intentionally
    // never used as an owner/creator/assignee below — those are all
    // internal-staff actions a Vendor-role account can't perform.
    void vendorUser;
    logger.info('Seeded 6 Users (one per role)');

    // -----------------------------------------------------------------
    // 4. Vendors (3 — one per riskRating: Low / Medium / High)
    // -----------------------------------------------------------------
    const vendors = await VendorModel.create([
      {
        name: 'CloudNet Solutions',
        vendorCode: 'V-001',
        contactEmail: 'contracts@cloudnetsolutions.example',
        contactPhone: '+1-415-555-0101',
        country: 'United States',
        businessUnits: [buEngineering._id],
        riskRating: 'Low',
        activeContractsCount: 0,
        isActive: true,
      },
      {
        name: 'DataStream Analytics',
        vendorCode: 'V-002',
        contactEmail: 'partnerships@datastreamanalytics.example',
        contactPhone: '+1-628-555-0104',
        country: 'United States',
        businessUnits: [buEngineering._id, buSales._id],
        riskRating: 'Medium',
        activeContractsCount: 0,
        isActive: true,
      },
      {
        name: 'NexGen Offshore Dev',
        vendorCode: 'V-003',
        contactEmail: 'contracts@nexgenoffshoredev.example',
        contactPhone: '+91-80-4555-0107',
        country: 'India',
        businessUnits: [buEngineering._id],
        riskRating: 'High',
        activeContractsCount: 0,
        isActive: true,
      },
    ]);
    logger.info('Seeded 3 Vendors');

    // -----------------------------------------------------------------
    // 5. Clauses (3)
    // -----------------------------------------------------------------
    const [clauseConfidentiality, clauseTermination, clausePayment] = await ClauseModel.create([
      {
        title: 'Standard Mutual Confidentiality',
        category: 'Confidentiality',
        text:
          'Each party agrees to hold in confidence all non-public information disclosed by the other party in connection with this Agreement, and shall not disclose such information to any third party without prior written consent, for a period of {{confidentialityPeriodYears}} years following termination.',
        isMandatory: true,
        applicableContractTypes: ['Vendor', 'Customer', 'Partnership', 'Service', 'Employment'],
      },
      {
        title: 'Termination for Cause',
        category: 'Termination',
        text:
          'A party may terminate this Agreement immediately upon written notice if the other party materially breaches any term hereof and fails to cure such breach within {{cureperiodDays}} days of receiving notice.',
        isMandatory: true,
        applicableContractTypes: ['Vendor', 'Customer', 'Partnership', 'Service', 'Employment'],
      },
      {
        title: 'Net 30 Payment Terms',
        category: 'Payment Terms',
        text:
          'Payment of undisputed invoices is due within thirty (30) days of the invoice date. Late payments accrue interest at {{lateInterestRate}}% per month.',
        isMandatory: false,
        applicableContractTypes: ['Vendor', 'Service', 'Customer'],
      },
    ]);
    logger.info('Seeded 3 Clauses');

    // -----------------------------------------------------------------
    // 6. Templates (3 — Vendor, Customer, Service)
    // -----------------------------------------------------------------
    const [templateVendor, templateCustomer, templateService] = await TemplateModel.create([
      {
        name: 'Standard Vendor Services Agreement',
        contractType: ContractType.VENDOR,
        sections: [
          { title: 'Confidentiality', order: 1, clauses: [clauseConfidentiality._id] },
          { title: 'Payment', order: 2, clauses: [clausePayment._id] },
          { title: 'Termination', order: 3, clauses: [clauseTermination._id] },
        ],
        variables: [
          { name: 'vendorName', label: 'Vendor Legal Name', type: 'text', required: true },
          { name: 'contractStartDate', label: 'Start Date', type: 'date', required: true },
          { name: 'annualFee', label: 'Annual Fee (USD)', type: 'number', required: true },
        ],
        isActive: true,
        createdBy: admin._id,
        currentVersion: null,
      },
      {
        name: 'Customer Master Service Agreement',
        contractType: ContractType.CUSTOMER,
        sections: [
          { title: 'Confidentiality', order: 1, clauses: [clauseConfidentiality._id] },
          { title: 'Payment', order: 2, clauses: [clausePayment._id] },
          { title: 'Termination', order: 3, clauses: [clauseTermination._id] },
        ],
        variables: [
          { name: 'customerName', label: 'Customer Legal Name', type: 'text', required: true },
          { name: 'subscriptionTier', label: 'Subscription Tier', type: 'text', required: true },
          { name: 'contractValue', label: 'Total Contract Value (USD)', type: 'number', required: true },
        ],
        isActive: true,
        createdBy: legalOfficer._id,
        currentVersion: null,
      },
      {
        name: 'Professional Services Agreement',
        contractType: ContractType.SERVICE,
        sections: [
          { title: 'Payment', order: 1, clauses: [clausePayment._id] },
          { title: 'Termination', order: 2, clauses: [clauseTermination._id] },
        ],
        variables: [
          { name: 'projectName', label: 'Project Name', type: 'text', required: true },
          { name: 'deliverableDueDate', label: 'Final Deliverable Due', type: 'date', required: true },
          { name: 'totalFee', label: 'Total Fee (USD)', type: 'number', required: true },
        ],
        isActive: true,
        createdBy: admin._id,
        currentVersion: null,
      },
    ]);
    const templateByType = new Map<ContractType, typeof templateVendor>([
      [ContractType.VENDOR, templateVendor],
      [ContractType.CUSTOMER, templateCustomer],
      [ContractType.SERVICE, templateService],
    ]);
    logger.info('Seeded 3 Templates');

    // -----------------------------------------------------------------
    // 7. Contracts — exactly 1 for every ContractStatus (11 total)
    // -----------------------------------------------------------------
    const contractTypes = [
      ContractType.VENDOR,
      ContractType.EMPLOYMENT,
      ContractType.CUSTOMER,
      ContractType.PARTNERSHIP,
      ContractType.SERVICE,
    ];
    const departments = [deptEngineering, deptSales, deptLegalFinance];
    const businessUnitByDept = new Map<string, typeof buEngineering>([
      [deptEngineering._id.toString(), buEngineering],
      [deptSales._id.toString(), buSales],
      [deptLegalFinance._id.toString(), buOperations],
    ]);
    const owners = [admin, legalOfficer, financeOfficer, executive, deptUser];
    const confidentialityLevels: Array<'Public' | 'Internal' | 'Confidential' | 'Restricted'> = [
      'Public',
      'Internal',
      'Confidential',
      'Restricted',
    ];
    const customerNames = ['Globex Retail Inc.', 'Initech Manufacturing'];
    const employeeNames = ['Alicia Fernandez', 'Tom Bradley'];

    const statuses = Object.values(ContractStatus);

    let contractSeq = 1;
    const seededContracts: IContract[] = [];

    for (let idx = 0; idx < statuses.length; idx++) {
      const status = statuses[idx];
      const contractType = pick(contractTypes, idx);
      const dept = pick(departments, idx);
      const businessUnit = businessUnitByDept.get(dept._id.toString())!;
      const owner = pick(owners, idx);
      const vendor = pick(vendors, idx);

      const contractNumber = `CLM-${new Date().getFullYear()}-${String(contractSeq).padStart(6, '0')}`;
      contractSeq++;

      // Lifecycle-appropriate dates per status.
      let effectiveDate: Date | null = null;
      let expiryDate: Date | null = null;
      switch (status) {
        case ContractStatus.DRAFT:
        case ContractStatus.IN_REVIEW:
        case ContractStatus.PENDING_APPROVAL:
        case ContractStatus.APPROVED:
        case ContractStatus.PENDING_SIGNATURE:
          effectiveDate = daysFromNow(30);
          expiryDate = daysFromNow(395);
          break;
        case ContractStatus.SIGNED:
          effectiveDate = daysFromNow(7);
          expiryDate = daysFromNow(372);
          break;
        case ContractStatus.ACTIVE:
          effectiveDate = daysFromNow(-90);
          expiryDate = daysFromNow(275);
          break;
        case ContractStatus.EXPIRED:
          effectiveDate = daysFromNow(-730);
          expiryDate = daysFromNow(-30);
          break;
        case ContractStatus.TERMINATED:
          effectiveDate = daysFromNow(-400);
          expiryDate = daysFromNow(120);
          break;
        case ContractStatus.RENEWED:
          effectiveDate = daysFromNow(-730);
          expiryDate = daysFromNow(-365);
          break;
        case ContractStatus.ARCHIVED:
          effectiveDate = daysFromNow(-900);
          expiryDate = daysFromNow(-540);
          break;
        default:
          break;
      }

      const parties: ContractParty[] = [];
      let title: string;
      if (contractType === ContractType.VENDOR) {
        title = `${vendor.name} — Vendor Services Agreement`;
        parties.push(
          { partyType: PartyType.INTERNAL, name: 'Acme Corporation', role: 'Contracting Entity' },
          { partyType: PartyType.VENDOR, refId: vendor._id.toString(), name: vendor.name, role: 'Service Provider' }
        );
      } else if (contractType === ContractType.CUSTOMER) {
        const customer = pick(customerNames, idx);
        title = `${customer} — Customer Master Service Agreement`;
        parties.push(
          { partyType: PartyType.INTERNAL, name: 'Acme Corporation', role: 'Service Provider' },
          { partyType: PartyType.CUSTOMER, name: customer, role: 'Customer' }
        );
      } else if (contractType === ContractType.EMPLOYMENT) {
        const employee = pick(employeeNames, idx);
        title = `${employee} — Employment Agreement`;
        parties.push(
          { partyType: PartyType.INTERNAL, name: 'Acme Corporation', role: 'Employer' },
          { partyType: PartyType.INTERNAL, name: employee, role: 'Employee' }
        );
      } else if (contractType === ContractType.PARTNERSHIP) {
        title = `${vendor.name} — Strategic Partnership Agreement`;
        parties.push(
          { partyType: PartyType.INTERNAL, name: 'Acme Corporation', role: 'Partner' },
          { partyType: PartyType.VENDOR, refId: vendor._id.toString(), name: vendor.name, role: 'Partner' }
        );
      } else {
        title = `${vendor.name} — Professional Services Agreement`;
        parties.push(
          { partyType: PartyType.INTERNAL, name: 'Acme Corporation', role: 'Client' },
          { partyType: PartyType.VENDOR, refId: vendor._id.toString(), name: vendor.name, role: 'Service Provider' }
        );
      }

      const template = templateByType.get(contractType);

      const contract = await ContractModel.create({
        contractNumber,
        title,
        contractType,
        department: dept._id,
        businessUnit: businessUnit._id,
        parties,
        effectiveDate,
        expiryDate,
        governingLawCountry: 'United States',
        timezone: 'UTC',
        status,
        currentVersion: null,
        activeWorkflow: null,
        contractValue: 25000 + idx * 5000,
        currency: 'USD',
        tags: [contractType.toLowerCase(), status.toLowerCase()],
        confidentialityLevel: pick(confidentialityLevels, idx),
        createdBy: owner._id,
        owner: owner._id,
        renewedFrom: null,
        renewedTo: null,
        sourceTemplate: template ? template._id : null,
        sourceTemplateVersionNumber: template ? 1 : null,
      });

      seededContracts.push(contract);
    }

    // Link the single Renewed contract to the single Active contract, so
    // renewedFrom/renewedTo aren't left universally null — mirrors what
    // contractService.renewContract sets up.
    const renewed = seededContracts.find((c) => c.status === ContractStatus.RENEWED);
    const active = seededContracts.find((c) => c.status === ContractStatus.ACTIVE);
    if (renewed && active) {
      renewed.renewedTo = active._id;
      active.renewedFrom = renewed._id;
      await renewed.save();
      await active.save();
    }

    logger.info(`Seeded ${seededContracts.length} Contracts (1 per status)`);

    // Sync Redis's per-tenant contract-number counter (see
    // contract-number.util.ts's generateContractNumber, which uses an
    // atomic Redis INCR on `contract-number-seq:{tenantId}:{year}`) to
    // the highest number this script just used. Without this, that
    // counter starts fresh at 1 the first time anyone creates a
    // contract through the UI/API for this tenant — colliding with the
    // sequential CLM-<year>-000001.. numbers assigned above, since this
    // script writes `contractNumber` directly into Mongo and never
    // touches Redis. Best-effort: if Redis isn't reachable right now,
    // warn and move on rather than failing the whole seed run — the
    // app's own fallback (a timestamp-suffixed number) still avoids a
    // hard crash, it just won't produce clean sequential numbers until
    // this is re-run with Redis up.
    try {
      await connectRedis();
      const year = new Date().getFullYear();
      const highestUsed = contractSeq - 1;
      await redisClient.set(`contract-number-seq:${tenantId}:${year}`, String(highestUsed));
      logger.info(`Synced Redis contract-number counter to ${highestUsed} for ${year}`);
    } catch (err) {
      logger.warn(
        'Could not sync the Redis contract-number counter — new contracts created through the app may collide with seeded contract numbers until this is fixed (re-run this script once Redis is reachable).',
        { error: err instanceof Error ? err.message : err }
      );
    }

    // -----------------------------------------------------------------
    // 8. Obligations — exactly 1 for every ObligationType (6 total)
    // -----------------------------------------------------------------
    const assignees = [legalOfficer, financeOfficer, deptUser];
    const obligationHosts = [
      ...seededContracts.filter((c) => [ContractStatus.ACTIVE, ContractStatus.SIGNED].includes(c.status)),
      ...seededContracts,
    ];

    const obligationTypes = Object.values(ObligationType);
    const obligationDescriptions: Record<ObligationType, string> = {
      [ObligationType.PAYMENT]: 'Quarterly license fee payment',
      [ObligationType.SERVICE]: 'Provide monthly service usage report',
      [ObligationType.DELIVERABLE]: 'Deliver signed statement of work for Phase 2',
      [ObligationType.SLA]: 'Maintain 99.9% platform uptime',
      [ObligationType.RENEWAL]: 'Send renewal notice 90 days before expiry',
      [ObligationType.COMPLIANCE]: 'Complete annual SOC 2 compliance attestation',
    };

    for (let idx = 0; idx < obligationTypes.length; idx++) {
      const type = obligationTypes[idx];
      const contract = pick(obligationHosts, idx);
      const assignee = pick(assignees, idx);
      const description = obligationDescriptions[type];
      const dueDate = daysFromNow(30);

      const typeFields: Partial<{
        amount: number | null;
        currency: string | null;
        slaThreshold: string | null;
        slaPenalty: string | null;
        breached: boolean;
      }> = { amount: null, currency: null, slaThreshold: null, slaPenalty: null, breached: false };

      if (type === ObligationType.PAYMENT) {
        typeFields.amount = 5000;
        typeFields.currency = 'USD';
      }
      if (type === ObligationType.SLA) {
        typeFields.slaThreshold = 'Platform availability of at least 99.9% measured monthly';
        typeFields.slaPenalty = '5% monthly service credit';
      }

      const recurrence =
        type === ObligationType.PAYMENT
          ? RecurrenceInterval.QUARTERLY
          : type === ObligationType.SERVICE || type === ObligationType.SLA
          ? RecurrenceInterval.MONTHLY
          : RecurrenceInterval.NONE;

      await ObligationModel.create({
        contract: contract._id,
        type,
        description,
        dueDate,
        assignedTo: assignee._id,
        status: ObligationStatus.PENDING,
        recurrence,
        completedAt: null,
        completedBy: null,
        evidence: null,
        ...typeFields,
      });
    }

    logger.info(`Seeded ${obligationTypes.length} Obligations (1 per type)`);
  });

  logger.info('Seed run complete.');
  logger.info(`Tenant slug: ${TENANT_SLUG}`);
  logger.info(
    'Seeded users (all share password "Password123!"): admin@acme.test, legal@acme.test, ' +
      'finance@acme.test, executive@acme.test, james.park@acme.test, vendor@acme.test'
  );

  await disconnectDatabase();
  // redisClient uses lazyConnect — quit() is a no-op if connectRedis()
  // above never actually connected (e.g. Redis was unreachable), so
  // this is always safe to call.
  await redisClient.quit().catch(() => undefined);
}

main().catch(async (err) => {
  logger.error('Seed run failed', { error: err instanceof Error ? err.message : err });
  console.error(err);
  await disconnectDatabase().catch(() => undefined);
  await redisClient.quit().catch(() => undefined);
  process.exitCode = 1;
});
