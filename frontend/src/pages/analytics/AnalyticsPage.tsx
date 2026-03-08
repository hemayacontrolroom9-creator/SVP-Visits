import React from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress } from '@mui/material';
import { Radar, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import { subDays } from 'date-fns';
import { reportsApi } from '../../services/api/reportsApi';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AnalyticsPage() {
  const { data: heatmap, isLoading } = useQuery({
    queryKey: ['heatmap'],
    queryFn: () => reportsApi.getActivityHeatmap({
      startDate: subDays(new Date(), 90).toISOString(),
      endDate: new Date().toISOString(),
    }).then((r) => r.data.data),
  });

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hourlyData = Array(7).fill(0).map((_, day) => {
    const dayData = (heatmap || []).filter((h: any) => parseInt(h.day_of_week) === day);
    return dayData.reduce((sum: number, h: any) => sum + parseInt(h.count), 0);
  });

  const activityData = {
    labels: days,
    datasets: [{
      label: 'Visits by Day',
      data: hourlyData,
      backgroundColor: 'rgba(25, 118, 210, 0.6)',
      borderColor: '#1976d2',
      borderWidth: 2,
    }],
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Analytics</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>Last 90 days activity analysis</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Visit Activity by Day of Week</Typography>
              {isLoading ? <CircularProgress /> : <Bar data={activityData} options={{ responsive: true, plugins: { legend: { display: false } } }} height={100} />}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Performance Overview</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                {[
                  { label: 'GPS Verification Rate', value: 87, color: '#1976d2' },
                  { label: 'On-Time Check-in', value: 72, color: '#2e7d32' },
                  { label: 'Checklist Completion', value: 94, color: '#ed6c02' },
                  { label: 'Visit Completion Rate', value: 89, color: '#9c27b0' },
                ].map((item) => (
                  <Box key={item.label}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">{item.label}</Typography>
                      <Typography variant="body2" fontWeight={700}>{item.value}%</Typography>
                    </Box>
                    <Box sx={{ height: 8, bgcolor: 'grey.200', borderRadius: 4, overflow: 'hidden', mt: 0.5 }}>
                      <Box sx={{ height: '100%', width: `${item.value}%`, bgcolor: item.color, borderRadius: 4 }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
