import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Grid, Button, Chip, Divider, CircularProgress, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { sitesApi } from '../../services/api/sitesApi';

export default function SiteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: site, isLoading } = useQuery({
    queryKey: ['site', id],
    queryFn: () => sitesApi.getOne(id!).then((r) => r.data.data),
  });

  if (isLoading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/sites')}>Back</Button>
        <Typography variant="h5" fontWeight={700}>{site?.name}</Typography>
        <Chip label={site?.status} color={site?.status === 'active' ? 'success' : 'default'} />
      </Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Site Information</Typography>
              <Divider sx={{ mb: 2 }} />
              {[
                ['Site Code', site?.siteCode],
                ['Address', site?.address],
                ['City', site?.city],
                ['Country', site?.country],
                ['Latitude', site?.latitude],
                ['Longitude', site?.longitude],
                ['Geofence Radius', `${site?.geofenceRadius}m`],
                ['Visit Frequency', `Every ${site?.visitFrequencyDays} days`],
              ].map(([label, value]) => (
                <Box key={label as string} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="body2" fontWeight={500}>{value || '-'}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Contact Information</Typography>
              <Divider sx={{ mb: 2 }} />
              {[
                ['Contact Name', site?.contactName],
                ['Phone', site?.contactPhone],
                ['Email', site?.contactEmail],
              ].map(([label, value]) => (
                <Box key={label as string} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="body2">{value || '-'}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
