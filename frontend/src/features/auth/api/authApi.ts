import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosClient, setAccessToken, refreshAccessToken } from '../../../shared/lib/axiosClient';
import { useAppDispatch } from '../../../shared/hooks/redux';
import { credentialsReceived, loggedOut, type AuthUser } from '../authSlice';

interface LoginResponse {
  data: { accessToken: string; user: AuthUser };
}

export function useRegisterOrganization() {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      email: string;
      password: string;
      tenantSlug: string;
      tenantName: string;
    }) => {
      const res = await axiosClient.post<LoginResponse>('/auth/register', input);
      return res.data.data;
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      dispatch(credentialsReceived(data));
    },
  });
}

export function useLogin() {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: async (input: { email: string; password: string; tenantSlug: string }) => {
      const res = await axiosClient.post<LoginResponse>('/auth/login', input);
      return res.data.data;
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      dispatch(credentialsReceived(data));
    },
  });
}

export function useLogout() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await axiosClient.post('/auth/logout');
    },
    onSuccess: () => {
      setAccessToken(null);
      dispatch(loggedOut());
      queryClient.clear(); 
    },
  });
}

export function useLogoutAllSessions() {
  return useMutation({
    mutationFn: async () => {
      await axiosClient.post('/auth/logout-all');
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: { currentPassword: string; newPassword: string }) => {
      const res = await axiosClient.post('/auth/change-password', input);
      return res.data.data;
    },
  });
}

export async function attemptSessionRestore(): Promise<{ accessToken: string } | null> {
  try {
    const accessToken = await refreshAccessToken();
    return { accessToken };
  } catch {
    return null;
  }
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const res = await axiosClient.get('/users/me');
  return res.data.data;
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (input: { email: string; tenantSlug: string }) => {
      const res = await axiosClient.post('/auth/forgot-password', input);
      return res.data.data;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (input: { token: string; newPassword: string }) => {
      const res = await axiosClient.post('/auth/reset-password', input);
      return res.data.data;
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (input: { token: string }) => {
      const res = await axiosClient.post('/auth/verify-email', input);
      return res.data.data;
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: async () => {
      const res = await axiosClient.post('/auth/resend-verification');
      return res.data.data;
    },
  });
}
