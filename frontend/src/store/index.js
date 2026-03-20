import { configureStore } from '@reduxjs/toolkit';
import authReducer   from './slices/authSlice';
import userReducer   from './slices/userSlice';
import pointsReducer from './slices/pointsSlice';
import appointmentsReducer from './slices/appointmentsSlice';
import notificationsReducer from './slices/notificationsSlice';

export const store = configureStore({
  reducer: {
    auth:          authReducer,
    user:          userReducer,
    points:        pointsReducer,
    appointments:  appointmentsReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
