import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  businessUnit: string | null;
  department: string | null;
  tenant: string;
  emailVerified: boolean;
  permissions: string[];
  avatarUrl: string | null;
  bio: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  status: 'idle' | 'checking' | 'authenticated' | 'unauthenticated';
}

const initialState: AuthState = {
  accessToken: null,
  user: null,
  status: 'idle',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    credentialsReceived(state, action: PayloadAction<{ accessToken: string; user: AuthUser }>) {
      state.accessToken = action.payload.accessToken;
      state.user = action.payload.user;
      state.status = 'authenticated';
    },
    accessTokenRefreshed(state, action: PayloadAction<{ accessToken: string }>) {
      state.accessToken = action.payload.accessToken;
      state.status = 'authenticated';
    },
    

    profileUpdated(state, action: PayloadAction<Partial<Pick<AuthUser, 'name' | 'avatarUrl' | 'bio'>>>) {
      if (state.user) Object.assign(state.user, action.payload);
    },
    sessionCheckStarted(state) {
      state.status = 'checking';
    },
    sessionCheckFailed(state) {
      state.accessToken = null;
      state.user = null;
      state.status = 'unauthenticated';
    },
    loggedOut(state) {
      state.accessToken = null;
      state.user = null;
      state.status = 'unauthenticated';
    },
  },
});

export const {
  credentialsReceived,
  accessTokenRefreshed,
  profileUpdated,
  sessionCheckStarted,
  sessionCheckFailed,
  loggedOut,
} = authSlice.actions;

export const selectIsAuthenticated = (state: RootState) => state.auth.status === 'authenticated';
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectAccessToken = (state: RootState) => state.auth.accessToken;
export const selectHasPermission = (permission: string) => (state: RootState) =>
  state.auth.user?.permissions.includes(permission) ?? false;

export default authSlice.reducer;
