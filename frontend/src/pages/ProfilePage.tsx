import React from 'react';
import { Box, Typography, Card, CardContent, Avatar, Grid, Divider, Chip } from '@mui/material';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../store/slices/authSlice';

export default function ProfilePage() {
  const user = useAppSelector(selectCurrentUser);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>My Profile</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ textAlign: 'center', p: 3 }}>
            <Avatar sx={{ width: 96, height: 96, bgcolor: 'primary.main', fontSize: 36, mx: 'auto', mb: 2 }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
            <Typography variant="h5" fontWeight={700}>{user?.firstName} {user?.lastName}</Typography>
            <Typography color="text.secondary" gutterBottom>{user?.email}</Typography>
            <Chip label={user?.role} color="primary" />
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Account Information</Typography>
              <Divider sx={{ mb: 2 }} />
              {[
                ['First Name', user?.firstName],
                ['Last Name', user?.lastName],
                ['Email', user?.email],
                ['Role', user?.role],
                ['Phone', user?.phone || '-'],
              ].map(([label, value]) => (
                <Box key={label as string} sx={{ display: 'flex', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ width: 160, color: 'text.secondary', flexShrink: 0 }} variant="body2">{label}</Typography>
                  <Typography variant="body2" fontWeight={500}>{value}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
