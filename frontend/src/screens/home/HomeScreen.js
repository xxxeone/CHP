import React, { useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { fetchPointsSummary, dailyCheckin } from '../../store/slices/pointsSlice';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();
  const { user }    = useSelector(s => s.auth);
  const { summary } = useSelector(s => s.points);
  const [refreshing, setRefreshing] = React.useState(false);

  useFocusEffect(useCallback(() => {
    dispatch(fetchPointsSummary());
  }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchPointsSummary());
    setRefreshing(false);
  };

  const handleCheckin = async () => {
    if (summary?.checked_in_today) return;
    const result = await dispatch(dailyCheckin());
    if (result.type === 'points/checkin/fulfilled') {
      dispatch(fetchPointsSummary());
    }
  };

  const tierColor = COLORS[summary?.membership_tier] || COLORS.bronze;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >

      {/* ── Points Card ─────────────────────────────── */}
      <LinearGradient colors={COLORS.primaryGradient} style={styles.pointsCard}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.greeting}>你好，{user?.first_name} 👋</Text>
            <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
              <Ionicons name="medal" size={12} color="#fff" />
              <Text style={styles.tierText}>{summary?.tier_name_zh || '铜牌会员'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.bellBtn}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Points balance */}
        <Text style={styles.pointsLabel}>当前积分</Text>
        <Text style={styles.pointsValue}>{(summary?.current_balance || 0).toLocaleString()}</Text>
        <Text style={styles.pointsSub}>Points Balance</Text>

        {/* Progress to next tier */}
        {summary?.next_tier && (
          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>
                距{summary.next_tier.name_zh}还需 {summary.points_to_next_tier.toLocaleString()} 积分
              </Text>
              <Text style={styles.progressPercent}>{summary.tier_progress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${summary.tier_progress}%` }]} />
            </View>
          </View>
        )}

        {/* Daily check-in */}
        <TouchableOpacity
          style={[styles.checkinBtn, summary?.checked_in_today && styles.checkinDone]}
          onPress={handleCheckin}
        >
          <Ionicons
            name={summary?.checked_in_today ? 'checkmark-circle' : 'calendar-outline'}
            size={16} color={summary?.checked_in_today ? COLORS.success : COLORS.secondary}
          />
          <Text style={[styles.checkinText, summary?.checked_in_today && styles.checkinDoneText]}>
            {summary?.checked_in_today ? '今日已签到 +10分' : '每日签到 +10积分'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* ── Quick Actions ─────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>快速操作 Quick Actions</Text>
        <View style={styles.quickActions}>
          {[
            { icon: 'calendar-outline',  label: '立即预约\nBook Now',  color: COLORS.primary,  screen: 'BookAppointment', tab: 'Appointments' },
            { icon: 'car-outline',       label: '我的车辆\nVehicles',  color: '#27AE60',        screen: 'VehiclesList',    tab: 'Vehicles' },
            { icon: 'gift-outline',      label: '积分兑换\nRewards',   color: '#E67E22',        screen: 'Rewards',         tab: 'Points' },
            { icon: 'time-outline',      label: '维修记录\nHistory',   color: '#8E44AD',        screen: 'ServiceHistory',  tab: 'Profile' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.quickBtn}
              onPress={() => navigation.navigate(item.tab, { screen: item.screen })}
            >
              <View style={[styles.quickIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={26} color={item.color} />
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Upcoming Appointment ──────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>即将到来的预约</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Appointments')}>
            <Text style={styles.seeAll}>全部 →</Text>
          </TouchableOpacity>
        </View>
        <UpcomingAppointmentCard navigation={navigation} />
      </View>

      {/* ── Member Benefits ───────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>会员权益 Benefits</Text>
        <LinearGradient colors={[tierColor + 'CC', tierColor]} style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>{summary?.tier_name_zh} 专属权益</Text>
          <Text style={styles.benefitItem}>✓ 每消费$1获得{summary?.points_per_dollar || 1}积分</Text>
          {summary?.discount_percent > 0 && (
            <Text style={styles.benefitItem}>✓ 享受 {summary.discount_percent}% 专属折扣</Text>
          )}
          <Text style={styles.benefitItem}>✓ 积分兑换维修服务</Text>
          <TouchableOpacity style={styles.upgradeBtn} onPress={() => navigation.navigate('Points')}>
            <Text style={styles.upgradeBtnText}>查看升级条件 →</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
}

function UpcomingAppointmentCard({ navigation }) {
  // This would fetch from the appointmentsSlice in production
  return (
    <TouchableOpacity
      style={styles.appointmentCard}
      onPress={() => navigation.navigate('Appointments')}
    >
      <View style={styles.appointmentLeft}>
        <Ionicons name="calendar" size={32} color={COLORS.primary} />
      </View>
      <View style={styles.appointmentInfo}>
        <Text style={styles.appointmentTitle}>暂无即将到来的预约</Text>
        <Text style={styles.appointmentSub}>No upcoming appointments</Text>
        <Text style={styles.appointmentCta}>点击立即预约 →</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.background },
  pointsCard:       { paddingTop: 56, paddingBottom: 24, paddingHorizontal: SPACING.lg },
  cardHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
  greeting:         { color: '#fff', fontSize: FONTS.sizes.lg, fontWeight: '600', marginBottom: 6 },
  tierBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8,
                      paddingVertical: 3, borderRadius: RADIUS.full, alignSelf: 'flex-start' },
  tierText:         { color: '#fff', fontSize: FONTS.sizes.xs, fontWeight: '700' },
  bellBtn:          { padding: 4 },
  pointsLabel:      { color: 'rgba(255,255,255,0.75)', fontSize: FONTS.sizes.sm, marginBottom: 4 },
  pointsValue:      { color: '#fff', fontSize: 52, fontWeight: '900', lineHeight: 56 },
  pointsSub:        { color: 'rgba(255,255,255,0.6)', fontSize: FONTS.sizes.sm, marginBottom: SPACING.md },
  progressSection:  { marginBottom: SPACING.md },
  progressRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel:    { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.sm },
  progressPercent:  { color: COLORS.secondary, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  progressBar:      { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3 },
  progressFill:     { height: 6, backgroundColor: COLORS.secondary, borderRadius: 3 },
  checkinBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)',
                      borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'flex-start' },
  checkinDone:      { backgroundColor: 'rgba(39,174,96,0.2)' },
  checkinText:      { color: COLORS.secondary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  checkinDoneText:  { color: COLORS.success },
  section:          { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  sectionRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle:     { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.black, marginBottom: SPACING.sm },
  seeAll:           { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  quickActions:     { flexDirection: 'row', justifyContent: 'space-between' },
  quickBtn:         { alignItems: 'center', flex: 1 },
  quickIcon:        { width: 60, height: 60, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickLabel:       { fontSize: 10, color: COLORS.black, textAlign: 'center', lineHeight: 14, fontWeight: '500' },
  appointmentCard:  { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md,
                      flexDirection: 'row', alignItems: 'center', ...SHADOWS.sm },
  appointmentLeft:  { width: 56, height: 56, backgroundColor: COLORS.lightGray, borderRadius: RADIUS.md,
                      justifyContent: 'center', alignItems: 'center', marginRight: SPACING.md },
  appointmentInfo:  { flex: 1 },
  appointmentTitle: { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.black },
  appointmentSub:   { fontSize: FONTS.sizes.sm, color: COLORS.gray, marginTop: 2 },
  appointmentCta:   { fontSize: FONTS.sizes.sm, color: COLORS.primary, fontWeight: '600', marginTop: 6 },
  benefitsCard:     { borderRadius: RADIUS.lg, padding: SPACING.lg },
  benefitsTitle:    { color: '#fff', fontSize: FONTS.sizes.lg, fontWeight: '700', marginBottom: SPACING.sm },
  benefitItem:      { color: 'rgba(255,255,255,0.9)', fontSize: FONTS.sizes.md, marginBottom: 6, lineHeight: 22 },
  upgradeBtn:       { marginTop: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.sm,
                      paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start' },
  upgradeBtnText:   { color: '#fff', fontSize: FONTS.sizes.sm, fontWeight: '700' },
});
