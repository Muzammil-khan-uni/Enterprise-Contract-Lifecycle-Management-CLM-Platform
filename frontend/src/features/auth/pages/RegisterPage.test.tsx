import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import authReducer from '../authSlice';
import notificationReducer from '../../notifications/notificationSlice';
import { axiosClient } from '../../../shared/lib/axiosClient';
import RegisterPage from './RegisterPage';

vi.mock('../../../shared/lib/axiosClient', () => ({
  axiosClient: { get: vi.fn(), post: vi.fn() },
}));

function renderPage() {
  const store = configureStore({ reducer: { auth: authReducer, notifications: notificationReducer } });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

describe('RegisterPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('auto-derives the slug from the organization name as it is typed', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Organization name'), 'Acme Corporation');

    expect(screen.getByLabelText('Organization slug')).toHaveValue('acme-corporation');
  });

  it('stops auto-deriving once the slug has been hand-edited', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Organization name'), 'Acme');
    await user.clear(screen.getByLabelText('Organization slug'));
    await user.type(screen.getByLabelText('Organization slug'), 'my-custom-slug');

    
    await user.type(screen.getByLabelText('Organization name'), ' Corp');

    expect(screen.getByLabelText('Organization slug')).toHaveValue('my-custom-slug');
  });

  it('submits the derived slug and navigates on success', async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({
      data: { data: { accessToken: 'tok', user: { id: 'u1', role: 'Admin' } } },
    });
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Organization name'), 'Acme Corporation');
    await user.type(screen.getByLabelText('Your name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'SuperSecret123');
    await user.click(screen.getByRole('button', { name: /create organization/i }));

    await waitFor(() => {
      expect(axiosClient.post).toHaveBeenCalledWith(
        '/auth/register',
        expect.objectContaining({ tenantSlug: 'acme-corporation', tenantName: 'Acme Corporation' })
      );
    });
  });

  it('shows a validation error for a malformed manually-entered slug', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText('Organization name'), 'Acme');
    await user.clear(screen.getByLabelText('Organization slug'));
    await user.type(screen.getByLabelText('Organization slug'), 'not valid!!');
    await user.type(screen.getByLabelText('Your name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'SuperSecret123');
    await user.click(screen.getByRole('button', { name: /create organization/i }));

    expect(await screen.findByText(/letters, numbers, and hyphens only/i)).toBeInTheDocument();
    expect(axiosClient.post).not.toHaveBeenCalled();
  });
});
