import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitsApi } from '../services/api/visitsApi';

export const VISITS_KEY = 'visits';

export function useVisits(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: [VISITS_KEY, filters],
    queryFn: () => visitsApi.getAll(filters),
    staleTime: 30_000,
  });
}

export function useVisit(id: string) {
  return useQuery({
    queryKey: [VISITS_KEY, id],
    queryFn: () => visitsApi.getById(id),
    enabled: !!id,
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ visitId, data }: { visitId: string; data: any }) =>
      visitsApi.checkIn(visitId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [VISITS_KEY] }),
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ visitId, data }: { visitId: string; data: any }) =>
      visitsApi.checkOut(visitId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [VISITS_KEY] }),
  });
}

export function useCreateVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: visitsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: [VISITS_KEY] }),
  });
}
