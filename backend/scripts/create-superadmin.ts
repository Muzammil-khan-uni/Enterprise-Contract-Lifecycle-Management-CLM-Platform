

import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { UserModel } from '../src/modules/users/user.model';
import { TenantModel } from '../src/modules/tenants/tenant.model';

interface ParsedArgs {
  command: 'grant' | 'revoke' | 'list';
  email?: string;
  tenantSlug?: string;
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command, ...rest] = argv;
  if (command !== 'grant' && command !== 'revoke' && command !== 'list') {
    throw new Error(`Unknown command "${command ?? ''}". Expected one of: grant, revoke, list.`);
  }

  const args: ParsedArgs = { command };
  for (let i = 0; i < rest.length; i += 2) {
    const flag = rest[i];
    const value = rest[i + 1];
    if (flag === '--email') args.email = value;
    else if (flag === '--tenant') args.tenantSlug = value;
    else throw new Error(`Unrecognized flag "${flag}".`);
  }

  if (command !== 'list') {
    if (!args.email || !args.tenantSlug) {
      throw new Error(`${command} requires both --email and --tenant.`);
    }
  }

  return args;
}

async function grantOrRevoke(command: 'grant' | 'revoke', email: string, tenantSlug: string): Promise<void> {
  const tenant = await TenantModel.findOne({ slug: tenantSlug.toLowerCase() });
  if (!tenant) {
    throw new Error(`No tenant found with slug "${tenantSlug}".`);
  }

  const user = await UserModel.findOne({ email: email.toLowerCase(), tenant: tenant._id });
  if (!user) {
    throw new Error(`No user found with email "${email}" in tenant "${tenantSlug}".`);
  }

  const nextValue = command === 'grant';
  if (user.isPlatformSuperAdmin === nextValue) {
    console.log(`${user.email} already has isPlatformSuperAdmin=${nextValue}. No change made.`);
    return;
  }

  user.isPlatformSuperAdmin = nextValue;
  await user.save();

  
  
  
  
  
  
  
  user.tokenVersion += 1;
  await user.save();

  console.log(
    `${command === 'grant' ? 'Granted' : 'Revoked'} platform superadmin ${command === 'grant' ? 'to' : 'from'} ${user.email} (tenant: ${tenant.slug}). Their existing sessions must refresh or re-login for this to take effect.`
  );
}

async function list(): Promise<void> {
  const superAdmins = await UserModel.find({ isPlatformSuperAdmin: true }).populate('tenant', 'slug name').exec();
  if (superAdmins.length === 0) {
    console.log('No platform superadmins currently exist.');
    return;
  }
  console.log(`${superAdmins.length} platform superadmin(s):`);
  for (const user of superAdmins) {
    const tenant = user.tenant as unknown as { slug?: string; name?: string } | null;
    console.log(`  - ${user.email} (tenant: ${tenant?.slug ?? 'unknown'})`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  await connectDatabase();
  try {
    if (args.command === 'list') {
      await list();
    } else {
      await grantOrRevoke(args.command, args.email as string, args.tenantSlug as string);
    }
  } finally {
    await disconnectDatabase();
  }
}

main().catch((err) => {
  console.error('create-superadmin failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
