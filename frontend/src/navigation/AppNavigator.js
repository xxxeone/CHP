import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

import { restoreSession } from '../store/slices/authSlice';
import { COLORS } from '../utils/theme';

// Auth screens
import LoginScreen       from '../screens/auth/LoginScreen';
import RegisterScreen    from '../screens/auth/RegisterScreen';
import OTPScreen         from '../screens/auth/OTPScreen';

// Main app screens
import HomeScreen        from '../screens/home/HomeScreen';
import VehiclesScreen    from '../screens/vehicles/VehiclesScreen';
import VehicleDetailScreen from '../screens/vehicles/VehicleDetailScreen';
import AddVehicleScreen  from '../screens/vehicles/AddVehicleScreen';
import AppointmentsScreen from '../screens/appointments/AppointmentsScreen';
import BookAppointmentScreen from '../screens/appointments/BookAppointmentScreen';
import AppointmentDetailScreen from '../screens/appointments/AppointmentDetailScreen';
import PointsScreen      from '../screens/points/PointsScreen';
import RewardsScreen     from '../screens/points/RewardsScreen';
import PointsHistoryScreen from '../screens/points/PointsHistoryScreen';
import ProfileScreen     from '../screens/profile/ProfileScreen';
import NotificationsScreen from '../screens/profile/NotificationsScreen';
import ServiceHistoryScreen from '../screens/profile/ServiceHistoryScreen';
import ServiceRecordDetailScreen from '../screens/profile/ServiceRecordDetailScreen';
import PromotionsScreen  from '../screens/promotions/PromotionsScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = {
  Home:         { focused: 'home',         blur: 'home-outline' },
  Vehicles:     { focused: 'car',          blur: 'car-outline' },
  Appointments: { focused: 'calendar',     blur: 'calendar-outline' },
  Points:       { focused: 'gift',         blur: 'gift-outline' },
  Profile:      { focused: 'person',       blur: 'person-outline' },
};

const TAB_LABELS = {
  Home: { zh: '首页', en: 'Home' },
  Vehicles: { zh: '我的车', en: 'Vehicles' },
  Appointments: { zh: '预约', en: 'Book' },
  Points: { zh: '积分', en: 'Points' },
  Profile: { zh: '我的', en: 'Profile' },
};

function MainTabs() {
  const lang = useSelector(s => s.auth.user?.preferred_lang || 'zh');

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => (
          <Ionicons
            name={focused ? TAB_ICONS[route.name].focused : TAB_ICONS[route.name].blur}
            size={size}
            color={color}
          />
        ),
        tabBarActiveTintColor:   COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          paddingBottom: 6,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      })}
    >
      <Tab.Screen name="Home"         component={HomeScreen}
        options={{ tabBarLabel: TAB_LABELS.Home[lang] }} />
      <Tab.Screen name="Vehicles"     component={VehiclesStack}
        options={{ tabBarLabel: TAB_LABELS.Vehicles[lang] }} />
      <Tab.Screen name="Appointments" component={AppointmentsStack}
        options={{ tabBarLabel: TAB_LABELS.Appointments[lang] }} />
      <Tab.Screen name="Points"       component={PointsStack}
        options={{ tabBarLabel: TAB_LABELS.Points[lang] }} />
      <Tab.Screen name="Profile"      component={ProfileStack}
        options={{ tabBarLabel: TAB_LABELS.Profile[lang] }} />
    </Tab.Navigator>
  );
}

function VehiclesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VehiclesList"   component={VehiclesScreen} />
      <Stack.Screen name="VehicleDetail"  component={VehicleDetailScreen} />
      <Stack.Screen name="AddVehicle"     component={AddVehicleScreen} />
    </Stack.Navigator>
  );
}

function AppointmentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AppointmentsList"   component={AppointmentsScreen} />
      <Stack.Screen name="BookAppointment"    component={BookAppointmentScreen} />
      <Stack.Screen name="AppointmentDetail"  component={AppointmentDetailScreen} />
    </Stack.Navigator>
  );
}

function PointsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PointsMain"    component={PointsScreen} />
      <Stack.Screen name="Rewards"       component={RewardsScreen} />
      <Stack.Screen name="PointsHistory" component={PointsHistoryScreen} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain"       component={ProfileScreen} />
      <Stack.Screen name="Notifications"     component={NotificationsScreen} />
      <Stack.Screen name="ServiceHistory"    component={ServiceHistoryScreen} />
      <Stack.Screen name="ServiceRecordDetail" component={ServiceRecordDetailScreen} />
      <Stack.Screen name="Promotions"        component={PromotionsScreen} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"    component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OTP"      component={OTPScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const dispatch = useDispatch();
  const { user, isRestoring } = useSelector(s => s.auth);

  useEffect(() => { dispatch(restoreSession()); }, []);

  if (isRestoring) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
