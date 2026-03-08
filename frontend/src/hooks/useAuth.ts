import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectAuthLoading,
  logout,
} from '../store/slices/authSlice';
import { authApi } from '../services/api/authApi';
import { UserRole } from '../types';

export function useAuth() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);

  const signOut = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) await authApi.logout(refreshToken);
    } catch (_) {
      // ignore errors on logout
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  }, [dispatch, navigate]);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false;
      return roles.includes(user.role as UserRole);
    },
    [user],
  );

  const isAdmin = hasRole(UserRole.ADMIN);
  const isManager = hasRole(UserRole.ADMIN, UserRole.MANAGER);
  const isSupervisor = hasRole(UserRole.SUPERVISOR);

  return { user, isAuthenticated, loading, signOut, hasRole, isAdmin, isManager, isSupervisor };
}
