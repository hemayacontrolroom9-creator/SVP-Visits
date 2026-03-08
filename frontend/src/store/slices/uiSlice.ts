import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: { id: string; message: string; type: 'success' | 'error' | 'warning' | 'info'; read: boolean }[];
}

const initialState: UIState = {
  sidebarOpen: true,
  theme: 'light',
  notifications: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen(state, action: PayloadAction<boolean>) { state.sidebarOpen = action.payload; },
    addNotification(state, action: PayloadAction<Omit<UIState['notifications'][0], 'id' | 'read'>>) {
      state.notifications.unshift({ ...action.payload, id: Date.now().toString(), read: false });
      if (state.notifications.length > 50) state.notifications.pop();
    },
    markNotificationRead(state, action: PayloadAction<string>) {
      const n = state.notifications.find((n) => n.id === action.payload);
      if (n) n.read = true;
    },
    clearNotifications(state) { state.notifications = []; },
  },
});

export const { toggleSidebar, setSidebarOpen, addNotification, markNotificationRead, clearNotifications } = uiSlice.actions;
export default uiSlice.reducer;
