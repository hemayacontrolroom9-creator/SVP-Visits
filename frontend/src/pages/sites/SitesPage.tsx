import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, Grid, CardContent, CardActions,
  Chip, CircularProgress, Alert, TextField, IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { useQuery } from '@tanstack/react-query';
import { sitesApi } from '../../services/api/sitesApi';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';

const statusColors: Record<string, any> = { active: 'success', inactive: 'default', maintenance: 'warning' };

export default function SitesPage() {
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['sites', search],
    queryFn: () => sitesApi.getAll({ search, limit: 50 }).then((r) => r.data.data),
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Sites</Typography>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <Button variant="contained" startIcon={<AddIcon />}>Add Site</Button>
        )}
      </Box>

      <TextField placeholder="Search sites..." size="small" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ mb: 3, width: 300 }} />

      {isLoading && <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>}
      {error && <Alert severity="error">Failed to load sites</Alert>}

      <Grid container spacing={2}>
        {data?.data?.map((site: any) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={site.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                  <Typography variant="h6" fontWeight={700} noWrap sx={{ maxWidth: 160 }}>{site.name}</Typography>
                  <Chip label={site.status} size="small" color={statusColors[site.status]} />
                </Box>
                <Typography variant="caption" color="primary.main" fontWeight={600}>{site.siteCode}</Typography>
                <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary" noWrap>{site.city || site.address}</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  Geofence: {site.geofenceRadius}m
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                <Tooltip title="View Details">
                  <IconButton size="small" onClick={() => navigate(`/sites/${site.id}`)}><VisibilityIcon fontSize="small" /></IconButton>
                </Tooltip>
                <Tooltip title="QR Code">
                  <IconButton size="small"><QrCode2Icon fontSize="small" /></IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
