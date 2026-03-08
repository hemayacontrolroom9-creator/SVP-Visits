import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Box, Typography, Card, CardContent, Button, Grid, TextField,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { visitsApi } from '../../services/api/visitsApi';
import { sitesApi } from '../../services/api/sitesApi';
import { usersApi } from '../../services/api/usersApi';

export default function ScheduleVisitPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { control, register, handleSubmit, formState: { errors } } = useForm();

  const { data: sites } = useQuery({ queryKey: ['sites-list'], queryFn: () => sitesApi.getAll({ limit: 100 }).then((r) => r.data.data.data) });
  const { data: supervisors } = useQuery({ queryKey: ['supervisors'], queryFn: () => usersApi.getSupervisors().then((r) => r.data.data) });

  const mutation = useMutation({
    mutationFn: (data: any) => visitsApi.create({ ...data, scheduledAt: data.scheduledAt.toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      navigate('/visits');
    },
  });

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/visits')}>Back</Button>
        <Typography variant="h5" fontWeight={700}>Schedule New Visit</Typography>
      </Box>

      <Card sx={{ maxWidth: 600 }}>
        <CardContent>
          {mutation.isError && <Alert severity="error" sx={{ mb: 2 }}>Failed to schedule visit</Alert>}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box component="form" onSubmit={handleSubmit((d) => mutation.mutate(d))} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <FormControl fullWidth required>
                <InputLabel>Site</InputLabel>
                <Controller name="siteId" control={control} defaultValue="" rules={{ required: true }}
                  render={({ field }) => (
                    <Select {...field} label="Site">
                      {sites?.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.name} ({s.siteCode})</MenuItem>)}
                    </Select>
                  )}
                />
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel>Supervisor</InputLabel>
                <Controller name="supervisorId" control={control} defaultValue="" rules={{ required: true }}
                  render={({ field }) => (
                    <Select {...field} label="Supervisor">
                      {supervisors?.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</MenuItem>)}
                    </Select>
                  )}
                />
              </FormControl>

              <Controller
                name="scheduledAt"
                control={control}
                defaultValue={new Date()}
                rules={{ required: true }}
                render={({ field }) => (
                  <DateTimePicker label="Scheduled Date & Time" value={field.value} onChange={field.onChange} />
                )}
              />

              <TextField label="Notes" multiline rows={3} {...register('notes')} fullWidth />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={mutation.isPending}
                fullWidth
              >
                {mutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Schedule Visit'}
              </Button>
            </Box>
          </LocalizationProvider>
        </CardContent>
      </Card>
    </Box>
  );
}
