

const API_BASE_URL = process.env.E2E_API_BASE_URL || 'http://localhost:5000/api/v1';

const TENANT_SLUG = 'acme';
const TENANT_NAME = 'Acme Corp (E2E)';
const ADMIN_EMAIL = 'admin@acme.com';
const ADMIN_PASSWORD = 'DemoPassword123';

async function postJson(path: string, body: unknown, token?: string) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}

export default async function globalSetup() {
  
  
  
  await postJson('/auth/register', {
    name: 'Admin User',
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    tenantSlug: TENANT_SLUG,
    tenantName: TENANT_NAME,
  });

  
  const login = await postJson('/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    tenantSlug: TENANT_SLUG,
  });
  if (!login.ok) {
    throw new Error(
      `e2e global setup: could not log in as the bootstrap admin (status ${login.status}). ` +
        `Is the backend running at ${API_BASE_URL}? Response: ${JSON.stringify(login.data)}`
    );
  }
  const token = login.data.data.accessToken as string;

  
  
  
  
  
  let businessUnitId: string | undefined;
  const createdBusinessUnit = await postJson('/business-units', { name: 'Operations', code: 'OPS' }, token);
  if (createdBusinessUnit.ok) {
    businessUnitId = createdBusinessUnit.data.data._id;
  } else {
    const existing = await fetch(`${API_BASE_URL}/business-units`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const existingData = await existing.json().catch(() => null);
    businessUnitId = existingData?.data?.[0]?._id;
  }

  if (businessUnitId) {
    await postJson('/departments', { name: 'General', code: 'GEN', businessUnit: businessUnitId }, token);
  }
}
