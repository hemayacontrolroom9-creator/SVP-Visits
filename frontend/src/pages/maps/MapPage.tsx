import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, InfoWindow } from '@react-google-maps/api';
import { Box, Typography, Card, CardContent, CircularProgress, Alert, Chip, Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '../../store/hooks';
import { sitesApi } from '../../services/api/sitesApi';

const containerStyle = { width: '100%', height: '600px' };
const defaultCenter = { lat: 25.2048, lng: 55.2708 };

export default function MapPage() {
  const [selectedSite, setSelectedSite] = useState<any>(null);
  const supervisorLocations = useAppSelector((s) => s.visits.supervisorLocations);
  const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: MAPS_KEY,
  });

  const { data: sites, isLoading } = useQuery({
    queryKey: ['map-sites'],
    queryFn: () => sitesApi.getMapSites().then((r) => r.data.data),
  });

  if (loadError) return <Alert severity="error">Failed to load Google Maps. Check your API key.</Alert>;
  if (!isLoaded || isLoading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Live Map</Typography>
        <Stack direction="row" spacing={1}>
          <Chip label={`${sites?.length || 0} Sites`} color="primary" size="small" />
          <Chip label={`${Object.keys(supervisorLocations).length} Active Supervisors`} color="success" size="small" />
        </Stack>
      </Box>

      <Card>
        <GoogleMap mapContainerStyle={containerStyle} center={defaultCenter} zoom={11}>
          {/* Site markers */}
          {sites?.map((site: any) => (
            <React.Fragment key={site.id}>
              <Marker
                position={{ lat: parseFloat(site.latitude), lng: parseFloat(site.longitude) }}
                title={site.name}
                onClick={() => setSelectedSite(site)}
                icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' }}
              />
              <Circle
                center={{ lat: parseFloat(site.latitude), lng: parseFloat(site.longitude) }}
                radius={site.geofenceRadius}
                options={{ strokeColor: '#1976d2', strokeOpacity: 0.6, fillColor: '#1976d2', fillOpacity: 0.1, strokeWeight: 2 }}
              />
            </React.Fragment>
          ))}

          {/* Supervisor location markers */}
          {Object.values(supervisorLocations).map((loc: any) => (
            <Marker
              key={loc.userId}
              position={{ lat: loc.lat, lng: loc.lng }}
              icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' }}
              title={`Supervisor: ${loc.userId}`}
            />
          ))}

          {selectedSite && (
            <InfoWindow
              position={{ lat: parseFloat(selectedSite.latitude), lng: parseFloat(selectedSite.longitude) }}
              onCloseClick={() => setSelectedSite(null)}
            >
              <Box sx={{ p: 1, minWidth: 180 }}>
                <Typography variant="subtitle2" fontWeight={700}>{selectedSite.name}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">{selectedSite.siteCode}</Typography>
                <Typography variant="caption" display="block">{selectedSite.address}</Typography>
                <Chip label={selectedSite.status} size="small" color="primary" sx={{ mt: 0.5 }} />
                <Typography variant="caption" display="block" mt={0.5}>
                  Geofence: {selectedSite.geofenceRadius}m radius
                </Typography>
              </Box>
            </InfoWindow>
          )}
        </GoogleMap>
      </Card>
    </Box>
  );
}
