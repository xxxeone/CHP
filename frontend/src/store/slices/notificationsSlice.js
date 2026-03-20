import { createSlice } from '@reduxjs/toolkit';
const notificationsSlice = createSlice({ name: 'notifications', initialState: { unreadCount: 0, list: [] }, reducers: {} });
export default notificationsSlice.reducer;
