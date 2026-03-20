import { createSlice } from '@reduxjs/toolkit';
const appointmentsSlice = createSlice({ name: 'appointments', initialState: { list: [] }, reducers: {} });
export default appointmentsSlice.reducer;
