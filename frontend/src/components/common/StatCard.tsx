import React from 'react';
import { Card, CardContent, Box, Typography, Chip } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: number;
  trendLabel?: string;
}

export default function StatCard({ title, value, subtitle, icon, color = '#2471d4', trend, trendLabel }: StatCardProps) {
  const isPositive = (trend ?? 0) >= 0;

  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: color, borderRadius: '4px 4px 0 0' }} />
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          <Box sx={{ color, p: 0.75, borderRadius: 1, bgcolor: `${color}18` }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h3" fontWeight={800} sx={{ color, lineHeight: 1, mb: 0.5 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        {trend !== undefined && (
          <Chip
            size="small"
            icon={isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
            label={trendLabel ?? `${isPositive ? '+' : ''}${trend}%`}
            color={isPositive ? 'success' : 'error'}
            variant="outlined"
            sx={{ mt: 1, fontSize: '0.7rem' }}
          />
        )}
      </CardContent>
    </Card>
  );
}
