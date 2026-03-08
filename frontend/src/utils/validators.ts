export const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  return /^\+?[\d\s\-()]{8,15}$/.test(phone);
};

export const isValidPassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/\d/.test(password)) errors.push('At least one number');
  if (!/[!@#$%^&*]/.test(password)) errors.push('At least one special character (!@#$%^&*)');
  return { valid: errors.length === 0, errors };
};

export const isValidCoordinate = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

export const isValidGeofenceRadius = (radius: number): boolean => {
  return radius >= 50 && radius <= 5000;
};

export const isWithinGeofence = (
  checkLat: number,
  checkLng: number,
  siteLat: number,
  siteLng: number,
  radiusMeters: number,
): boolean => {
  const R = 6371000;
  const dLat = ((checkLat - siteLat) * Math.PI) / 180;
  const dLng = ((checkLng - siteLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((siteLat * Math.PI) / 180) *
      Math.cos((checkLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return distance <= radiusMeters;
};

export const requiredField = (value: unknown): string | undefined => {
  if (value === null || value === undefined || value === '') return 'This field is required';
  return undefined;
};
