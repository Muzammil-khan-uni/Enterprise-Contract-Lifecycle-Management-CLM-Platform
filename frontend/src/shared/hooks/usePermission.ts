import { useAppSelector } from './redux';
import { selectHasPermission } from '../../features/auth/authSlice';

export function usePermission(permission: string): boolean {
  return useAppSelector(selectHasPermission(permission));
}
