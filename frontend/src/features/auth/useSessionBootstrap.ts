import { useEffect } from 'react';
import { useAppDispatch } from '../../shared/hooks/redux';
import { setOnAuthFailure } from '../../shared/lib/axiosClient';
import { attemptSessionRestore, fetchCurrentUser } from './api/authApi';
import { credentialsReceived, sessionCheckFailed, sessionCheckStarted, loggedOut } from './authSlice';

export function useSessionBootstrap(): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    setOnAuthFailure(() => dispatch(loggedOut()));

    let cancelled = false;
    dispatch(sessionCheckStarted());

    (async () => {
      const restored = await attemptSessionRestore();
      if (!restored) {
        if (!cancelled) dispatch(sessionCheckFailed());
        return;
      }
      try {
        const user = await fetchCurrentUser();
        if (!cancelled) dispatch(credentialsReceived({ accessToken: restored.accessToken, user }));
      } catch {
        if (!cancelled) dispatch(sessionCheckFailed());
      }
    })();

    return () => {
      cancelled = true;
    };
    
  }, []);
}
