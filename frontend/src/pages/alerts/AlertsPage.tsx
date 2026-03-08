import React from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Tooltip, CircularProgress, Alert, TablePagination,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { alertsApi } from '../../services/api/alertsApi';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';

const severityColors: Record<string, any> = { low: 'default', medium: 'info', high: 'warning', critical: 'error' };
const statusColors: Record<string, any> = { active: 'error', acknowledged: 'warning', resolved: 'success', dismissed: 'default' };

export default function AlertsPage() {
  const user = useAppSelector(selectCurrentUser);
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['alerts', page],
    queryFn: () => alertsApi.getAll({ page: page + 1, limit: 20 }).then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const ackMutation = useMutation({
    mutationFn: alertsApi.acknowledge,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const resolveMutation = useMutation({
    mutationFn: alertsApi.resolve,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Alerts</Typography>
      {isLoading && <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>}
      {error && <Alert severity="error">Failed to load alerts</Alert>}
      {!isLoading && (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  {(user?.role === 'admin' || user?.role === 'manager') && <TableCell align="center">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.data?.map((alert: any) => (
                  <TableRow key={alert.id} hover sx={{ bgcolor: alert.status === 'active' ? 'error.50' : 'inherit' }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{alert.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{alert.message}</Typography>
                    </TableCell>
                    <TableCell>{alert.type.replace(/_/g, ' ')}</TableCell>
                    <TableCell><Chip label={alert.severity} size="small" color={severityColors[alert.severity]} /></TableCell>
                    <TableCell><Chip label={alert.status} size="small" color={statusColors[alert.status]} /></TableCell>
                    <TableCell>{format(new Date(alert.createdAt), 'MMM dd h:mm a')}</TableCell>
                    {(user?.role === 'admin' || user?.role === 'manager') && (
                      <TableCell align="center">
                        {alert.status === 'active' && (
                          <Tooltip title="Acknowledge">
                            <IconButton size="small" onClick={() => ackMutation.mutate(alert.id)} disabled={ackMutation.isPending}>
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {alert.status !== 'resolved' && (
                          <Tooltip title="Resolve">
                            <IconButton size="small" color="success" onClick={() => resolveMutation.mutate(alert.id)} disabled={resolveMutation.isPending}>
                              <DoneAllIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={data?.meta?.total || 0}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={20}
            onRowsPerPageChange={() => {}}
            rowsPerPageOptions={[20]}
          />
        </Card>
      )}
    </Box>
  );
}
