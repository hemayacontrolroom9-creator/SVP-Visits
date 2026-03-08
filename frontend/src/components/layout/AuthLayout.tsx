import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Box, Paper, Typography, Avatar } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import { useAppSelector } from '../../store/hooks';
import { selectIsAuthenticated } from '../../store/slices/authSlice';

export default function AuthLayout() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
    }}>
      <Paper elevation={8} sx={{ p: 4, width: '100%', maxWidth: 420, borderRadius: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mx: 'auto', mb: 1 }}>
            <SecurityIcon fontSize="large" />
          </Avatar>
          <Typography variant="h5" fontWeight={700}>Supervisor Visit</Typography>
          <Typography variant="body2" color="text.secondary">Management System</Typography>
        </Box>
        <Outlet />
      </Paper>
    </Box>
  );
}
