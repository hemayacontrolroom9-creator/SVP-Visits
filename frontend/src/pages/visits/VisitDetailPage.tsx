import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button, Divider,
  CircularProgress, Alert, Stack, Avatar, List, ListItem, ListItemText,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { visitsApi } from '../../services/api/visitsApi';

const statusColors: Record<string, any> = {
  scheduled: 'primary', in_progress: 'warning', completed: 'success', missed: 'error', cancelled: 'default',
};

export default function VisitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: visit, isLoading, error } = useQuery({
    queryKey: ['visit', id],
    queryFn: () => visitsApi.getOne(id!).then((r) => r.data.data),
  });

  if (isLoading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">Visit not found</Alert>;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/visits')}>Back</Button>
        <Typography variant="h5" fontWeight={700}>Visit #{visit?.visitNumber}</Typography>
        <Chip label={visit?.status?.replace('_', ' ')} color={statusColors[visit?.status]} />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Visit Information</Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Site</Typography>
                  <Typography fontWeight={600}>{visit?.site?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{visit?.site?.address}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Supervisor</Typography>
                  <Typography fontWeight={600}>{visit?.supervisor?.firstName} {visit?.supervisor?.lastName}</Typography>
                  <Typography variant="caption" color="text.secondary">{visit?.supervisor?.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Scheduled</Typography>
                      <Typography variant="body2">{visit?.scheduledAt ? format(new Date(visit.scheduledAt), 'MMM dd, yyyy h:mm a') : '-'}</Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Duration</Typography>
                  <Typography>{visit?.durationMinutes ? `${visit.durationMinutes} minutes` : 'Not completed'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Verification</Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" spacing={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <LocationOnIcon color={visit?.isGpsVerified ? 'success' : 'disabled'} />
                  <Box>
                    <Typography variant="body2">GPS Verification</Typography>
                    <Chip
                      label={visit?.isGpsVerified ? 'Verified' : 'Not Verified'}
                      size="small"
                      color={visit?.isGpsVerified ? 'success' : 'default'}
                    />
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <QrCodeScannerIcon color={visit?.isQrVerified ? 'success' : 'disabled'} />
                  <Box>
                    <Typography variant="body2">QR Code Verification</Typography>
                    <Chip
                      label={visit?.isQrVerified ? 'Verified' : 'Not Verified'}
                      size="small"
                      color={visit?.isQrVerified ? 'success' : 'default'}
                    />
                  </Box>
                </Box>
              </Stack>
              {visit?.checkInDistanceMeters !== null && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Check-in distance from site: {visit?.checkInDistanceMeters}m
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Timeline</Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1}>
                {[
                  { label: 'Scheduled', time: visit?.scheduledAt, icon: <AccessTimeIcon fontSize="small" /> },
                  { label: 'Started (Check-in)', time: visit?.startedAt, icon: <CheckCircleIcon fontSize="small" color="success" /> },
                  { label: 'Completed (Check-out)', time: visit?.completedAt, icon: <CheckCircleIcon fontSize="small" color="primary" /> },
                ].map((item) => (
                  <Box key={item.label} display="flex" alignItems="center" gap={1}>
                    {item.icon}
                    <Box>
                      <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                      <Typography variant="body2">
                        {item.time ? format(new Date(item.time), 'MMM dd h:mm a') : '-'}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {visit?.photoUrls?.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Photos</Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={1}>
                  {visit.photoUrls.map((url: string, i: number) => (
                    <Grid item xs={6} key={i}>
                      <img src={url} alt={`Visit photo ${i + 1}`} style={{ width: '100%', borderRadius: 4, aspectRatio: '1', objectFit: 'cover' }} />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
