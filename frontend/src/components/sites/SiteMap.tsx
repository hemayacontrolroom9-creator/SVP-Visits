import React, { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { Site, SupervisorLocation } from '../../types';

interface SiteMapProps {
  sites?: Site[];
  supervisorLocations?: SupervisorLocation[];
  selectedSite?: Site;
  height?: number | string;
  onSiteClick?: (site: Site) => void;
}

// Google Maps wrapper — renders map when VITE_GOOGLE_MAPS_KEY is set
export default function SiteMap({ sites = [], supervisorLocations = [], selectedSite, height = 400, onSiteClick }: SiteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_KEY;
    if (!key || !mapRef.current || !window.google) return;

    const center = selectedSite
      ? { lat: selectedSite.latitude, lng: selectedSite.longitude }
      : { lat: 25.2048, lng: 55.2708 };

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: selectedSite ? 16 : 11,
      styles: [{ elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] }],
    });

    // Site markers
    sites.forEach(site => {
      const marker = new window.google.maps.Marker({
        position: { lat: site.latitude, lng: site.longitude },
        map: mapInstance.current!,
        title: site.name,
        icon: { url: `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%232471d4" opacity=".9"/></svg>`, scaledSize: new window.google.maps.Size(24, 24) },
      });
      new window.google.maps.Circle({
        map: mapInstance.current!,
        center: { lat: site.latitude, lng: site.longitude },
        radius: site.geofenceRadius,
        fillColor: '#2471d4',
        fillOpacity: 0.08,
        strokeColor: '#2471d4',
        strokeOpacity: 0.4,
        strokeWeight: 1,
      });
      if (onSiteClick) marker.addListener('click', () => onSiteClick(site));
    });

    // Supervisor markers
    supervisorLocations.forEach(loc => {
      new window.google.maps.Marker({
        position: { lat: loc.latitude, lng: loc.longitude },
        map: mapInstance.current!,
        title: loc.supervisorName,
        icon: { url: `data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%2322c55e" opacity=".9"/></svg>`, scaledSize: new window.google.maps.Size(20, 20) },
      });
    });
  }, [sites, supervisorLocations, selectedSite]);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  if (!apiKey) {
    return (
      <Box sx={{ height, bgcolor: '#0d1f35', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed', borderColor: 'divider' }}>
        <Typography color="text.secondary" variant="body2">
          Set VITE_GOOGLE_MAPS_KEY in .env to enable the live map
        </Typography>
      </Box>
    );
  }

  return <Box ref={mapRef} sx={{ height, borderRadius: 2, overflow: 'hidden' }} />;
}
