import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, TextField, Select, MenuItem,
  FormControl, InputLabel, Tooltip, CircularProgress, Alert, TablePagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { visitsApi } from '../../services/api/visitsApi';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';

const statusColors: Record<string, any> = {
  scheduled: 'primary', in_progress: 'warning', completed: 'success', missed: 'error', cancelled: 'default',
};

export default function VisitsPage() {
  const navigate = useNavigate();
  const user = useAppSelector(selectCurrentUser);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['visits', page, rowsPerPage, statusFilter],
    queryFn: () => visitsApi.getAll({
      page: page + 1,
      limit: rowsPerPage,
      status: statusFilter || undefined,
    }).then((r) => r.data.data),
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Visits</Typography>
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/visits/schedule')}>
            Schedule Visit
          </Button>
        )}
      </Box>

      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search visits..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="missed">Missed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Card>

      {isLoading && <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>}
      {error && <Alert severity="error">Failed to load visits</Alert>}

      {!isLoading && (
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Site</TableCell>
                  <TableCell>Supervisor</TableCell>
                  <TableCell>Scheduled</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Verification</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data?.data?.map((visit: any) => (
                  <TableRow key={visit.id} hover>
                    <TableCell>{visit.visitNumber}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{visit.site?.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{visit.site?.siteCode}</Typography>
                    </TableCell>
                    <TableCell>{visit.supervisor?.firstName} {visit.supervisor?.lastName}</TableCell>
                    <TableCell>{format(new Date(visit.scheduledAt), 'MMM dd, yyyy h:mm a')}</TableCell>
                    <TableCell>
                      <Chip label={visit.status.replace('_', ' ')} size="small" color={statusColors[visit.status]} />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5}>
                        {visit.isGpsVerified && <Tooltip title="GPS Verified"><LocationOnIcon fontSize="small" color="success" /></Tooltip>}
                        {visit.isQrVerified && <Tooltip title="QR Verified"><QrCodeScannerIcon fontSize="small" color="success" /></Tooltip>}
                      </Box>
                    </TableCell>
                    <TableCell>{visit.durationMinutes ? `${visit.durationMinutes} min` : '-'}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => navigate(`/visits/${visit.id}`)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
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
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </Card>
      )}
    </Box>
  );
}
