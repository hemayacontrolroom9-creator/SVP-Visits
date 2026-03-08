import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import { Box, CircularProgress } from '@mui/material';
import { subDays, format } from 'date-fns';
import { reportsApi } from '../../services/api/reportsApi';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function VisitSummaryChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['visit-summary'],
    queryFn: () => reportsApi.getVisitSummary({
      startDate: subDays(new Date(), 30).toISOString(),
      endDate: new Date().toISOString(),
    }).then((r) => r.data.data),
  });

  if (isLoading) return <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>;

  const labels = (data || []).map((d: any) => format(new Date(d.date), 'MMM dd'));
  const completed = (data || []).map((d: any) => parseInt(d.completed) || 0);
  const missed = (data || []).map((d: any) => parseInt(d.missed) || 0);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Completed',
        data: completed,
        borderColor: '#2e7d32',
        backgroundColor: 'rgba(46, 125, 50, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Missed',
        data: missed,
        borderColor: '#d32f2f',
        backgroundColor: 'rgba(211, 47, 47, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  return (
    <Line
      data={chartData}
      options={{
        responsive: true,
        plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      }}
      height={80}
    />
  );
}
