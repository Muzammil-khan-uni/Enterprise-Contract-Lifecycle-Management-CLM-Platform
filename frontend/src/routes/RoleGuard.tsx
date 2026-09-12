import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../shared/hooks/redux';
import { selectCurrentUser } from '../features/auth/authSlice';

export function RoleGuard({ allowedRoles }: { allowedRoles: string[] }) {
  const user = useAppSelector(selectCurrentUser);
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
