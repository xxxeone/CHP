import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import {
  fetchPointsSummary, fetchPointsHistory,
  dailyCheckin, clearCheckinResult,
} from '../../store/slices/pointsSlice';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

const TRANSACTION_ICONS = {
  earn_service:   { icon: 'car',            color: '#27AE60' },
  earn_referral:  { icon: 'people',         color: '#2980B9' },
  earn_birthday:  { icon: 'gift',           color: '#E91E63' },
  earn_review:    { icon: 'star',           color: '#F39C12' },
  earn_checkin:   { icon: 'calendar',       color: '#9B59B6' },
  earn_promotion: { icon: 'pricetag',       color: '#16A085' },
  earn_milestone: { icon: 'trophy',         color: '#D35400' },
  redeem_discount:{ icon: 'cut',            color: '#E74C3C' },
  redeem_service: { icon: 'construct',      color: '#E74C3C' },
  expire:         { icon: 'hourglass',      color: '#95A5A6' },
  adjust_manual:  { icon: 'settings',       color: '#7F8C8D' },
};

export default function PointsScreen({ navigation }) {
  const dispatch = useDispatch();
  const { summary, history, checkinResult } = useSelector(s => s.points);
  const lang = useSelector(s => s.auth.user?.preferred_lang || 'zh');

  useFocusEffect(React.useCallback(() => {
    dispatch(fetchPointsSummary());
    dispatch(fetchPointsHistory({ limit: 10 }));
  }, []));

  useEffect(() => {
    if (checkinResult) {
      Alert.alert(
        lang === 'zh' ? '签到成功！' : 'Check-in Success!',
        lang === 'zh'
          ? `获得 ${checkinResult.points_earned} 积分\n当前余额：${checkinResult.new_balance} 积分`
          : `Earned ${checkinResult.points_earned} points\nBalance: ${checkinResult.new_balance}`,
        [{ text: 'OK', onPress: () => dispatch(clearCheckinResult()) }]
      );
    }
  }, [checkinResult]);

  const tierColor = COLORS[summary?.membership_tier] || COLORS.bronze;

  return (
    <ScrollView style={styles.container}>

      {/* ── Points Balance Card ──────────────────── */}
      <LinearGradient colors={COLORS.primaryGradient} style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>
          {lang === 'zh' ? '积分余额' : 'Points Balance'}
        </Text>
        <Text style={styles.balanceValue}>{(summary?.current_balance || 0).toLocaleString()}</Text>

        {/* Tier badge */}
        <View style={[styles.tierRow]}>
          <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
            <Ionicons name="medal" size={14} color="#fff" />
            <Text style={styles.tierBadgeText}>
              {lang === 'zh' ? summary?.tier_name_zh : summary?.tier_name_en}
            </Text>
          </View>
          <Text style={styles.multiplierText}>
            × {summary?.points_per_dollar} pts per $1
          </Text>
        </View>

        {/* Progress */}
        {summary?.next_tier && (
          <View style={styles.progress}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressText}>
                {lang === 'zh'
                  ? `距${summary.next_tier.name_zh}还差 ${summary.points_to_next_tier} 积分`
                  : `${summary.points_to_next_tier} pts to ${summary.next_tier.name_en}`}
              </Text>
              <Text style={styles.progressPct}>{summary.tier_progress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${summary.tier_progress}%` }]} />
            </View>
          </View>
        )}
      </LinearGradient>

      {/* ── Quick Actions ────────────────────────── */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, summary?.checked_in_today && styles.actionBtnDone]}
          onPress={() => dispatch(dailyCheckin())}
          disabled={summary?.checked_in_today}
        >
          <Ionicons
            name={summary?.checked_in_today ? 'checkmark-circle' : 'calendar-outline'}
            size={22}
            color={summary?.checked_in_today ? COLORS.success : COLORS.primary}
          />
          <Text style={styles.actionLabel}>
            {summary?.checked_in_today
              ? (lang === 'zh' ? '已签到' : 'Checked in')
              : (lang === 'zh' ? '每日签到' : 'Daily Check-in')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Rewards')}
        >
          <Ionicons name="gift-outline" size={22} color={COLORS.primary} />
          <Text style={styles.actionLabel}>{lang === 'zh' ? '积分兑换' : 'Redeem'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('PointsHistory')}
        >
          <Ionicons name="list-outline" size={22} color={COLORS.primary} />
          <Text style={styles.actionLabel}>{lang === 'zh' ? '积分明细' : 'History'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Tier Benefits ────────────────────────── */}
      <TierProgressSection summary={summary} lang={lang} />

      {/* ── Recent Transactions ──────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {lang === 'zh' ? '最近积分记录' : 'Recent Transactions'}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('PointsHistory')}>
            <Text style={styles.seeAll}>{lang === 'zh' ? '全部 →' : 'All →'}</Text>
          </TouchableOpacity>
        </View>

        {history.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-outline" size={32} color={COLORS.gray} />
            <Text style={styles.emptyText}>
              {lang === 'zh' ? '暂无积分记录' : 'No transactions yet'}
            </Text>
          </View>
        ) : (
          history.map(tx => (
            <TransactionRow key={tx.id} tx={tx} lang={lang} />
          ))
        )}
      </View>

      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
}

function TierProgressSection({ summary, lang }) {
  const tiers = [
    { tier: 'bronze',   name_zh: '铜牌',   name_en: 'Bronze',   min: 0,     color: COLORS.bronze },
    { tier: 'silver',   name_zh: '银牌',   name_en: 'Silver',   min: 1000,  color: COLORS.silver },
    { tier: 'gold',     name_zh: '金牌',   name_en: 'Gold',     min: 5000,  color: COLORS.gold },
    { tier: 'platinum', name_zh: '铂金',   name_en: 'Platinum', min: 20000, color: COLORS.platinum },
  ];

  return (
    <View style={styles.tiersSection}>
      <Text style={styles.sectionTitle}>
        {lang === 'zh' ? '会员等级' : 'Membership Tiers'}
      </Text>
      <View style={styles.tiersRow}>
        {tiers.map(t => {
          const isActive = summary?.membership_tier === t.tier;
          return (
            <View key={t.tier} style={[styles.tierCard, isActive && styles.tierCardActive]}>
              <View style={[styles.tierIcon, { backgroundColor: t.color + '20' }]}>
                <Ionicons name="medal" size={20} color={t.color} />
              </View>
              <Text style={[styles.tierName, { color: t.color }]}>
                {lang === 'zh' ? t.name_zh : t.name_en}
              </Text>
              <Text style={styles.tierMin}>{t.min.toLocaleString()}</Text>
              <Text style={styles.tierMinLabel}>pts</Text>
              {isActive && (
                <View style={[styles.currentBadge, { backgroundColor: t.color }]}>
                  <Text style={styles.currentBadgeText}>当前</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function TransactionRow({ tx, lang }) {
  const meta = TRANSACTION_ICONS[tx.transaction_type] || { icon: 'ellipse', color: COLORS.gray };
  const isEarn = tx.points > 0;

  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: meta.color + '18' }]}>
        <Ionicons name={meta.icon} size={18} color={meta.color} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txDesc} numberOfLines={1}>
          {lang === 'zh' ? tx.description_zh : tx.description_en}
        </Text>
        <Text style={styles.txDate}>
          {new Date(tx.created_at).toLocaleDateString('zh-CN')}
        </Text>
      </View>
      <Text style={[styles.txPoints, { color: isEarn ? COLORS.success : COLORS.danger }]}>
        {isEarn ? '+' : ''}{tx.points}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.background },
  balanceCard:     { paddingTop: 56, paddingBottom: 28, paddingHorizontal: SPACING.lg },
  balanceLabel:    { color: 'rgba(255,255,255,0.7)', fontSize: FONTS.sizes.sm, marginBottom: 4 },
  balanceValue:    { color: '#fff', fontSize: 52, fontWeight: '900', lineHeight: 58 },
  tierRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: SPACING.sm, marginBottom: SPACING.md },
  tierBadge:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  tierBadgeText:   { color: '#fff', fontSize: FONTS.sizes.sm, fontWeight: '700' },
  multiplierText:  { color: 'rgba(255,255,255,0.7)', fontSize: FONTS.sizes.sm },
  progress:        { marginTop: 4 },
  progressLabels:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressText:    { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.sm },
  progressPct:     { color: COLORS.secondary, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  progressBar:     { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3 },
  progressFill:    { height: 6, backgroundColor: COLORS.secondary, borderRadius: 3 },
  actionsRow:      { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff',
                     paddingVertical: SPACING.md, ...SHADOWS.sm },
  actionBtn:       { alignItems: 'center', gap: 6, paddingHorizontal: SPACING.lg },
  actionBtnDone:   { opacity: 0.6 },
  actionLabel:     { fontSize: FONTS.sizes.xs, color: COLORS.black, fontWeight: '500' },
  tiersSection:    { padding: SPACING.lg },
  tiersRow:        { flexDirection: 'row', gap: 8, marginTop: SPACING.sm },
  tierCard:        { flex: 1, backgroundColor: '#fff', borderRadius: RADIUS.md, padding: 10,
                     alignItems: 'center', ...SHADOWS.sm, borderWidth: 2, borderColor: 'transparent' },
  tierCardActive:  { borderColor: COLORS.primary },
  tierIcon:        { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  tierName:        { fontSize: FONTS.sizes.xs, fontWeight: '700', marginBottom: 2 },
  tierMin:         { fontSize: FONTS.sizes.sm, fontWeight: '900', color: COLORS.black },
  tierMinLabel:    { fontSize: 9, color: COLORS.gray },
  currentBadge:    { marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.full },
  currentBadgeText:{ color: '#fff', fontSize: 9, fontWeight: '700' },
  section:         { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg },
  sectionHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  sectionTitle:    { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.black },
  seeAll:          { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  emptyCard:       { alignItems: 'center', padding: SPACING.xl, backgroundColor: '#fff', borderRadius: RADIUS.md },
  emptyText:       { color: COLORS.gray, marginTop: SPACING.sm, fontSize: FONTS.sizes.md },
  txRow:           { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                     borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: 8, ...SHADOWS.sm },
  txIcon:          { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
  txInfo:          { flex: 1 },
  txDesc:          { fontSize: FONTS.sizes.md, fontWeight: '500', color: COLORS.black },
  txDate:          { fontSize: FONTS.sizes.xs, color: COLORS.gray, marginTop: 2 },
  txPoints:        { fontSize: FONTS.sizes.lg, fontWeight: '800' },
});
