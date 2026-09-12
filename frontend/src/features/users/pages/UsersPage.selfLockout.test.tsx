import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import authReducer, { credentialsReceived } from '../../auth/authSlice';
import notificationReducer from '../../notifications/notificationSlice';
import { axiosClient } from '../../../shared/lib/axiosClient';
import UsersPage from './UsersPage';
import type { AdminUserProfile } from '../types';

vi.mock('../../../shared/lib/axiosClient', () => ({
  axiosClient: { get: vi.fn(), patch: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

const SELF: AdminUserProfile = {
  id: 'admin-1',
  name: 'Ada Admin',
  email: 'ada@acme.test',
  role: 'Admin',
  businessUnit: null,
  department: null,
  permissionOverrides: [],
  isActive: true,
  emailVerified: true,
  lastLoginAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const TEAMMATE: AdminUserProfile = {
  ...SELF,
  id: 'legal-1',
  name: 'Lee Legal',
  email: 'lee@acme.test',
  role: 'LegalOfficer',
};

function renderUsersPage() {
  const store = configureStore({
    reducer: { auth: authReducer, notifications: notificationReducer },
  });
  store.dispatch(
    credentialsReceived({
      accessToken: 'test-token',
      user: {
        id: SELF.id,
        name: SELF.name,
        email: SELF.email,
        role: SELF.role,
        businessUnit: null,
        department: null,
        tenant: 'tenant-1',
        emailVerified: true,
        permissions: ['user:manage'],
        avatarUrl: null,
        bio: null,
      },
    })
  );

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <UsersPage />
      </QueryClientProvider>
    </Provider>
  );
}

describe('UsersPage self-lockout guard', () => {
  beforeEach(() => {
    vi.mocked(axiosClient.get).mockResolvedValue({ data: { data: [SELF, TEAMMATE] } });
  });

  it("disables Deactivate for the signed-in admin's own active row", async () => {
    renderUsersPage();

    const selfRow = (await screen.findByText('Ada Admin')).closest('tr')!;
    const deactivateButton = within(selfRow).getByRole('button', { name: /deactivate/i });
    expect(deactivateButton).toBeDisabled();
  });

  it('leaves Deactivate enabled for a different active user', async () => {
    renderUsersPage();

    const teammateRow = (await screen.findByText('Lee Legal')).closest('tr')!;
    const deactivateButton = within(teammateRow).getByRole('button', { name: /deactivate/i });
    expect(deactivateButton).not.toBeDisabled();
  });
});
