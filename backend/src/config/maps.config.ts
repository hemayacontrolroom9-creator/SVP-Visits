import { registerAs } from '@nestjs/config';

export const mapsConfig = registerAs('maps', () => ({
  apiKey: process.env.GOOGLE_MAPS_API_KEY,
  geocodingKey: process.env.GOOGLE_MAPS_GEOCODING_KEY,
  defaultGeofenceRadius: 200, // meters
  maxDistanceFromSite: 500, // meters - max allowed distance for check-in
}));
