import React from 'react';
import { List, ListItem, ListItemText, ListItemAvatar, Avatar, Chip, Typography, Box, CircularProgress } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { visitsApi } from '../../services/api/visitsApi';

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  scheduled: 'primary',
  in_progress: 'warning',
  completed: 'success',
  missed: 'error',
  cancelled: 'default',
};

export default function TodayVisitsList() {
  const { data, isLoading } = useQuery({
    queryKey: ['today-visits'],
    queryFn: () => visitsApi.getToday().then((r) => r.data.data),
    refetchInterval: 60000,
  });

  if (isLoading) return <Box display="flex" justifyContent="center" py={2}><CircularProgress size={24} /></Box>;
  if (!data?.length) return <Typography color="text.secondary" textAlign="center" py={2}>No visits scheduled today</Typography>;

  return (
    <List dense sx={{ maxHeight: 350, overflow: 'auto' }}>
      {data.map((visit: any) => (
        <ListItem key={visit.id} divider sx={{ py: 1 }}>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36 }}>
              <LocationOnIcon fontSize="small" />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={<Typography variant="body2" fontWeight={600} noWrap>{visit.site?.name}</Typography>}
            secondary={
              <Box>
                <Typography variant="caption" display="block">{visit.supervisor?.firstName} {visit.supervisor?.lastName}</Typography>
                <Typography variant="caption" color="text.secondary">{format(new Date(visit.scheduledAt), 'h:mm a')}</Typography>
              </Box>
            }
          />
          <Chip label={visit.status.replace('_', ' ')} size="small" color={statusColors[visit.status]} sx={{ fontSize: 10 }} />
        </ListItem>
      ))}
    </List>
  );
}
