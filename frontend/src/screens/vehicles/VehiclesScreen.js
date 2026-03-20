import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { vehiclesAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

const FUEL_ICONS = {
  gasoline: 'flame-outline',
  diesel:   'water-outline',
  electric: 'flash-outline',
  hybrid:   'leaf-outline',
  other:    'car-outline',
};

export default function VehiclesScreen({ navigation }) {
  const lang = useSelector(s => s.auth.user?.preferred_lang || 'zh');
  const [vehicles,   setVehicles]   = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading,    setLoading]    = useState(true);

  const loadVehicles = async () => {
    try {
      const { data } = await vehiclesAPI.getAll();
      setVehicles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadVehicles(); }, []));

  const handleDelete = (vehicle) => {
    Alert.alert(
      lang === 'zh' ? '删除车辆' : 'Delete Vehicle',
      lang === 'zh' ? `确定删除 ${vehicle.make} ${vehicle.model}？` : `Delete ${vehicle.make} ${vehicle.model}?`,
      [
        { text: lang === 'zh' ? '取消' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'zh' ? '删除' : 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await vehiclesAPI.remove(vehicle.id);
              loadVehicles();
            } catch {
              Alert.alert('Error', 'Failed to delete vehicle');
            }
          }
        }
      ]
    );
  };

  const handleSetPrimary = async (id) => {
    try {
      await vehiclesAPI.setPrimary(id);
      loadVehicles();
    } catch {
      Alert.alert('Error', 'Failed to update vehicle');
    }
  };

  const renderVehicle = ({ item: v }) => {
    const nextServiceKm = v.next_service_mileage;
    const kmToService = nextServiceKm ? nextServiceKm - v.mileage : null;
    const needsService = kmToService !== null && kmToService <= 1000;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('VehicleDetail', { vehicleId: v.id })}
        activeOpacity={0.8}
      >
        {/* Card top – color band */}
        <LinearGradient
          colors={v.is_primary ? COLORS.primaryGradient : ['#636e72', '#b2bec3']}
          style={styles.cardHeader}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <View>
            <Text style={styles.vehicleName}>{v.nickname || `${v.make} ${v.model}`}</Text>
            <Text style={styles.vehicleYear}>{v.year}</Text>
          </View>
          <View style={styles.cardActions}>
            {v.is_primary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryText}>主车 Primary</Text>
              </View>
            )}
            <Ionicons name="car" size={40} color="rgba(255,255,255,0.3)" />
          </View>
        </LinearGradient>

        {/* Card body */}
        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <InfoChip icon="speedometer-outline" text={`${(v.mileage || 0).toLocaleString()} km`} />
            {v.fuel_type && (
              <InfoChip icon={FUEL_ICONS[v.fuel_type] || 'car-outline'} text={v.fuel_type} />
            )}
            {v.license_plate && (
              <InfoChip icon="card-outline" text={v.license_plate} />
            )}
          </View>

          {needsService && (
            <View style={styles.serviceAlert}>
              <Ionicons name="warning-outline" size={14} color={COLORS.warning} />
              <Text style={styles.serviceAlertText}>
                {lang === 'zh'
                  ? `距下次保养还有 ${kmToService} km`
                  : `${kmToService} km to next service`}
              </Text>
            </View>
          )}

          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.footerBtn}
              onPress={() => navigation.navigate('BookAppointment', { vehicleId: v.id })}
            >
              <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
              <Text style={styles.footerBtnText}>{lang === 'zh' ? '立即预约' : 'Book'}</Text>
            </TouchableOpacity>

            {!v.is_primary && (
              <TouchableOpacity style={styles.footerBtn} onPress={() => handleSetPrimary(v.id)}>
                <Ionicons name="star-outline" size={16} color={COLORS.gray} />
                <Text style={[styles.footerBtnText, { color: COLORS.gray }]}>
                  {lang === 'zh' ? '设为主车' : 'Set Primary'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => handleDelete(v)}>
              <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{lang === 'zh' ? '我的车辆' : 'My Vehicles'}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddVehicle')}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={v => v.id}
        renderItem={renderVehicle}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadVehicles(); }} />}
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="car-outline" size={64} color={COLORS.border} />
              <Text style={styles.emptyTitle}>{lang === 'zh' ? '还没有车辆' : 'No Vehicles Yet'}</Text>
              <Text style={styles.emptySub}>{lang === 'zh' ? '添加您的爱车，开始享受专属服务' : 'Add your vehicle to get started'}</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('AddVehicle')}>
                <Text style={styles.emptyBtnText}>{lang === 'zh' ? '+ 添加车辆' : '+ Add Vehicle'}</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </View>
  );
}

const InfoChip = ({ icon, text }) => (
  <View style={styles.chip}>
    <Ionicons name={icon} size={12} color={COLORS.gray} />
    <Text style={styles.chipText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: COLORS.background },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                       paddingTop: 52, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md, backgroundColor: '#fff' },
  title:             { fontSize: FONTS.sizes.h3, fontWeight: '800', color: COLORS.black },
  addBtn:            { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary,
                       justifyContent: 'center', alignItems: 'center' },
  list:              { padding: SPACING.lg, gap: SPACING.md },
  card:              { backgroundColor: '#fff', borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOWS.md },
  cardHeader:        { padding: SPACING.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  vehicleName:       { color: '#fff', fontSize: FONTS.sizes.xl, fontWeight: '800' },
  vehicleYear:       { color: 'rgba(255,255,255,0.7)', fontSize: FONTS.sizes.md },
  cardActions:       { alignItems: 'flex-end' },
  primaryBadge:      { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADIUS.sm,
                       paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
  primaryText:       { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardBody:          { padding: SPACING.md },
  infoRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.sm },
  chip:              { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.lightGray,
                       borderRadius: RADIUS.sm, paddingHorizontal: 8, paddingVertical: 4 },
  chipText:          { fontSize: FONTS.sizes.xs, color: COLORS.gray, fontWeight: '500' },
  serviceAlert:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF3CD',
                       borderRadius: RADIUS.sm, padding: 8, marginBottom: SPACING.sm },
  serviceAlertText:  { fontSize: FONTS.sizes.sm, color: COLORS.warning, fontWeight: '500' },
  cardFooter:        { flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
                       borderTopWidth: 1, borderTopColor: COLORS.lightGray, paddingTop: SPACING.sm },
  footerBtn:         { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerBtnText:     { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  empty:             { alignItems: 'center', paddingTop: 80 },
  emptyTitle:        { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.black, marginTop: SPACING.md },
  emptySub:          { fontSize: FONTS.sizes.md, color: COLORS.gray, marginTop: 6, textAlign: 'center' },
  emptyBtn:          { marginTop: SPACING.lg, backgroundColor: COLORS.primary, borderRadius: RADIUS.md,
                       paddingHorizontal: SPACING.xl, paddingVertical: 12 },
  emptyBtnText:      { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: '700' },
});
