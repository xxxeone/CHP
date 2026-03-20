import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { pointsAPI } from '../../services/api';

export const fetchPointsSummary = createAsyncThunk('points/summary', async () => {
  const { data } = await pointsAPI.getSummary();
  return data;
});

export const fetchPointsHistory = createAsyncThunk('points/history', async (params) => {
  const { data } = await pointsAPI.getHistory(params);
  return data;
});

export const fetchRewards = createAsyncThunk('points/rewards', async () => {
  const { data } = await pointsAPI.getRewards();
  return data;
});

export const dailyCheckin = createAsyncThunk('points/checkin', async (_, { rejectWithValue }) => {
  try {
    const { data } = await pointsAPI.checkin();
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Check-in failed');
  }
});

export const redeemReward = createAsyncThunk('points/redeem', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await pointsAPI.redeem(payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Redemption failed');
  }
});

const pointsSlice = createSlice({
  name: 'points',
  initialState: {
    summary:       null,
    history:       [],
    rewards:       [],
    isLoading:     false,
    checkinResult: null,
    redeemResult:  null,
    error:         null,
  },
  reducers: {
    clearCheckinResult: (state) => { state.checkinResult = null; },
    clearRedeemResult:  (state) => { state.redeemResult = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPointsSummary.pending,   (s) => { s.isLoading = true; })
      .addCase(fetchPointsSummary.fulfilled, (s, { payload }) => { s.isLoading = false; s.summary = payload; })
      .addCase(fetchPointsSummary.rejected,  (s) => { s.isLoading = false; })

      .addCase(fetchPointsHistory.fulfilled, (s, { payload }) => { s.history = payload.data; })
      .addCase(fetchRewards.fulfilled,       (s, { payload }) => { s.rewards = payload.rewards; })

      .addCase(dailyCheckin.fulfilled,  (s, { payload }) => {
        s.checkinResult = payload;
        if (s.summary) s.summary.current_balance = payload.new_balance;
        if (s.summary) s.summary.checked_in_today = true;
      })
      .addCase(dailyCheckin.rejected,   (s, { payload }) => { s.error = payload; })

      .addCase(redeemReward.fulfilled,  (s, { payload }) => {
        s.redeemResult = payload;
        if (s.summary) s.summary.current_balance = payload.new_balance;
      })
      .addCase(redeemReward.rejected,   (s, { payload }) => { s.error = payload; });
  },
});

export const { clearCheckinResult, clearRedeemResult } = pointsSlice.actions;
export default pointsSlice.reducer;
