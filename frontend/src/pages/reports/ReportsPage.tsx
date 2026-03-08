import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, CircularProgress, Alert, Button } from '@mui/material';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import { subDays, format } from 'date-fns';
import { reportsApi } from '../../services/api/reportsApi';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function ReportsPage() {
  const [dateRange] = useState({
    start: subDays(new Date(), 30).toISOString(),
    end: new Date().toISOString(),
  });

  const { data: compliance, isLoading: loadingCompliance } = useQuery({
    queryKey: ['compliance'],
    queryFn: () => reportsApi.getCompliance({ startDate: dateRange.start, endDate: dateRange.end }).then((r) => r.data.data),
  });

  const { data: bySupervisor, isLoading: loadingBySup } = useQuery({
    queryKey: ['by-supervisor'],
    queryFn: () => reportsApi.getVisitsBySupervisor({ startDate: dateRange.start, endDate: dateRange.end }).then((r) => r.data.data),
  });

  const supervisorChartData = {
    labels: (bySupervisor || []).slice(0, 10).map((s: any) => `${s.first_name} ${s.last_name}`),
    datasets: [
      { label: 'Completed', data: (bySupervisor || []).slice(0, 10).map((s: any) => parseInt(s.completed) || 0), backgroundColor: '#2e7d32' },
      { label: 'Missed', data: (bySupervisor || []).slice(0, 10).map((s: any) => parseInt(s.missed) || 0), backgroundColor: '#d32f2f' },
    ],
  };

  const complianceDoughnutData = {
    labels: ['Completed', 'Missed', 'Cancelled'],
    datasets: [{
      data: [
        parseInt(compliance?.completed) || 0,
        parseInt(compliance?.missed) || 0,
        Math.max(0, parseInt(compliance?.total_visits) - parseInt(compliance?.completed) - parseInt(compliance?.missed)) || 0,
      ],
      backgroundColor: ['#2e7d32', '#d32f2f', '#9e9e9e'],
    }],
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Reports</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom mb={3}>Last 30 days</Typography>

      <Grid container spacing={3} mb={3}>
        {[
          { label: 'Total Visits', value: compliance?.total_visits || 0, color: 'primary.main' },
          { label: 'Completion Rate', value: `${compliance?.completion_rate || 0}%`, color: 'success.main' },
          { label: 'GPS Verification Rate', value: `${compliance?.gps_verification_rate || 0}%`, color: 'info.main' },
          { label: 'Avg Duration', value: compliance?.avg_duration ? `${Math.round(compliance.avg_duration)} min` : '-', color: 'warning.main' },
        ].map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={700} color={stat.color}>{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Visits by Supervisor (Top 10)</Typography>
              {loadingBySup ? <CircularProgress /> : <Bar data={supervisorChartData} options={{ responsive: true, plugins: { legend: { position: 'top' } }, scales: { x: { stacked: false } } }} height={100} />}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Visit Status Distribution</Typography>
              {loadingCompliance ? <CircularProgress /> : <Doughnut data={complianceDoughnutData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
