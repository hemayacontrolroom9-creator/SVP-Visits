import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface VisitsState {
  activeVisitId: string | null;
  supervisorLocations: Record<string, { lat: number; lng: number; timestamp: string; userId: string }>;
  filters: { status?: string; siteId?: string; supervisorId?: string };
}

const initialState: VisitsState = {
  activeVisitId: null,
  supervisorLocations: {},
  filters: {},
};

const visitsSlice = createSlice({
  name: 'visits',
  initialState,
  reducers: {
    setActiveVisit(state, action: PayloadAction<string | null>) { state.activeVisitId = action.payload; },
    updateSupervisorLocation(state, action: PayloadAction<{ userId: string; lat: number; lng: number; timestamp: string }>) {
      state.supervisorLocations[action.payload.userId] = action.payload;
    },
    setFilters(state, action: PayloadAction<Partial<VisitsState['filters']>>) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters(state) { state.filters = {}; },
  },
});

export const { setActiveVisit, updateSupervisorLocation, setFilters, clearFilters } = visitsSlice.actions;
export default visitsSlice.reducer;
