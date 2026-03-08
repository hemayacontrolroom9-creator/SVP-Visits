import React from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip, CircularProgress, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { reportsApi } from '../services/api/reportsApi';
import VisitSummaryChart from '../components/analytics/VisitSummaryChart';
import TodayVisitsList from '../components/visits/TodayVisitsList';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

function StatCard({ title, value, subtitle, icon, color, trend }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>{title}</Typography>
            <Typography variant="h4" fontWeight={700}>{value}</Typography>
            {subtitle && <Typography variant="body2" color="text.secondary" mt={0.5}>{subtitle}</Typography>}
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon fontSize="small" sx={{ color: trend >= 0 ? 'success.main' : 'error.main', mr: 0.5 }} />
                <Typography variant="caption" color={trend >= 0 ? 'success.main' : 'error.main'}>
                  {trend >= 0 ? '+' : ''}{trend}% from yesterday
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ bgcolor: color, borderRadius: 2, p: 1.5, color: 'white' }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: dashData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reportsApi.getDashboard().then((r) => r.data.data),
    refetchInterval: 30000,
  });

  if (isLoading) return <Box display="flex" justifyContent="center" mt={4}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">Failed to load dashboard data</Alert>;

  const stats = dashData?.visits || {};

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Today's Visits"
            value={stats.today || 0}
            subtitle={`${stats.completionRate || 0}% completion rate`}
            icon={<PendingActionsIcon />}
            color="#1976d2"
            trend={5}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Completed Today"
            value={stats.completedToday || 0}
            subtitle={`of ${stats.today || 0} scheduled`}
            icon={<CheckCircleOutlineIcon />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Active Visits"
            value={stats.inProgress || 0}
            subtitle="Currently in progress"
            icon={<LocationOnIcon />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Active Alerts"
            value={dashData?.alerts?.active || 0}
            subtitle="Require attention"
            icon={<WarningAmberIcon />}
            color="#d32f2f"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Visit Activity (Last 30 Days)</Typography>
              <VisitSummaryChart />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Today's Schedule</Typography>
              <TodayVisitsList />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
