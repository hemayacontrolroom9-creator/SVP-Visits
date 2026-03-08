import React from 'react';
import { Card, CardContent, Box, Typography, Chip, Stack, Divider, Tooltip, IconButton } from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Visit } from '../../types';
import { formatTime, formatVisitDuration, getStatusColor, getStatusLabel, initials } from '../../utils/formatters';
import { Avatar } from '@mui/material';

interface VisitCardProps {
  visit: Visit;
  onClick?: (visit: Visit) => void;
  compact?: boolean;
}

export default function VisitCard({ visit, onClick, compact = false }: VisitCardProps) {
  const statusColor = getStatusColor(visit.status) as any;

  return (
    <Card
      variant="outlined"
      sx={{ borderRadius: 2, cursor: onClick ? 'pointer' : 'default', transition: 'all 0.15s', '&:hover': onClick ? { borderColor: 'primary.main', boxShadow: 2 } : {} }}
      onClick={() => onClick?.(visit)}
    >
      <CardContent sx={{ p: compact ? 1.5 : 2, '&:last-child': { pb: compact ? 1.5 : 2 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Box display="flex" alignItems="center" gap={1.5} flex={1} minWidth={0}>
            <Avatar sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
              {initials(visit.supervisor.firstName, visit.supervisor.lastName)}
            </Avatar>
            <Box minWidth={0}>
              <Typography variant="body2" fontWeight={700} noWrap>{visit.supervisor.firstName} {visit.supervisor.lastName}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="flex" alignItems="center" gap={0.5}>
                <LocationOnIcon sx={{ fontSize: 12 }} />{visit.site.name}
              </Typography>
            </Box>
          </Box>
          <Chip label={getStatusLabel(visit.status)} color={statusColor} size="small" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
        </Box>

        {!compact && <Divider sx={{ my: 1 }} />}

        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Box display="flex" alignItems="center" gap={0.5}>
            <AccessTimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {formatTime(visit.scheduledAt)}
            </Typography>
          </Box>
          {visit.checkInAt && (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography variant="caption" color="text.secondary">
                {formatVisitDuration(visit.checkInAt, visit.checkOutAt)}
              </Typography>
            </Box>
          )}
          <Box display="flex" alignItems="center" gap={0.5} ml="auto !important">
            <Tooltip title="GPS Verified">
              <GpsFixedIcon sx={{ fontSize: 14, color: visit.isGpsVerified ? 'success.main' : 'action.disabled' }} />
            </Tooltip>
            <Tooltip title="QR Verified">
              <QrCodeScannerIcon sx={{ fontSize: 14, color: visit.isQrVerified ? 'success.main' : 'action.disabled' }} />
            </Tooltip>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
