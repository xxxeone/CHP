import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { authAPI, usersAPI } from '../../services/api';

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.login(credentials);
    await SecureStore.setItemAsync('access_token', data.token);
    await SecureStore.setItemAsync('refresh_token', data.refreshToken);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Login failed');
  }
});

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.register(userData);
    await SecureStore.setItemAsync('access_token', data.token);
    await SecureStore.setItemAsync('refresh_token', data.refreshToken);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Registration failed');
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try { await authAPI.logout(); } catch {}
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
});

export const restoreSession = createAsyncThunk('auth/restore', async (_, { rejectWithValue }) => {
  try {
    const token = await SecureStore.getItemAsync('access_token');
    if (!token) return rejectWithValue('No token');
    const { data } = await usersAPI.getMe();
    return { user: data, token };
  } catch {
    return rejectWithValue('Session expired');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:        null,
    token:       null,
    isLoading:   false,
    isRestoring: true,
    error:       null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
    updateUser:  (state, { payload }) => { state.user = { ...state.user, ...payload }; },
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.isLoading = true; state.error = null; };
    const rejected = (state, { payload }) => { state.isLoading = false; state.error = payload; };

    builder
      .addCase(login.pending,    pending)
      .addCase(login.fulfilled,  (state, { payload }) => {
        state.isLoading = false;
        state.user  = payload.user;
        state.token = payload.token;
      })
      .addCase(login.rejected,   rejected)

      .addCase(register.pending,   pending)
      .addCase(register.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.user  = payload.user;
        state.token = payload.token;
      })
      .addCase(register.rejected, rejected)

      .addCase(logout.fulfilled, (state) => {
        state.user = null; state.token = null;
      })

      .addCase(restoreSession.pending,   (state) => { state.isRestoring = true; })
      .addCase(restoreSession.fulfilled, (state, { payload }) => {
        state.isRestoring = false;
        state.user  = payload.user;
        state.token = payload.token;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.isRestoring = false;
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
