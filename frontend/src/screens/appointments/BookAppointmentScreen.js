import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { appointmentsAPI, vehiclesAPI } from '../../services/api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

const SERVICE_OPTIONS = [
  { id: 'oil_change',   label_zh: '机油更换',   label_en: 'Oil Change',       icon: 'water-outline' },
  { id: 'inspection',   label_zh: '全车检查',   label_en: 'Inspection',       icon: 'search-outline' },
  { id: 'brakes',       label_zh: '刹车维修',   label_en: 'Brake Service',    icon: 'disc-outline' },
  { id: 'tires',        label_zh: '轮胎服务',   label_en: 'Tyre Service',     icon: 'reload-outline' },
  { id: 'ac',           label_zh: '空调维修',   label_en: 'AC Service',       icon: 'snow-outline' },
  { id: 'electrical',   label_zh: '电气维修',   label_en: 'Electrical',       icon: 'flash-outline' },
  { id: 'engine',       label_zh: '发动机',     label_en: 'Engine',           icon: 'settings-outline' },
  { id: 'other',        label_zh: '其他',       label_en: 'Other',            icon: 'build-outline' },
];

export default function BookAppointmentScreen({ navigation }) {
  const lang = useSelector(s => s.auth.user?.preferred_lang || 'zh');
  const [step,           setStep]      = useState(1); // 1=vehicle, 2=services, 3=date/time, 4=confirm
  const [vehicles,       setVehicles]  = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedDate,   setSelectedDate]   = useState('');
  const [selectedTime,   setSelectedTime]   = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [description,    setDescription]    = useState('');
  const [loading,        setLoading]        = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const minDate = today;
  const maxDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 60 days

  useEffect(() => {
    vehiclesAPI.getAll().then(({ data }) => {
      setVehicles(data);
      if (data.length === 1) setSelectedVehicle(data[0]);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      appointmentsAPI.getAvailableSlots(selectedDate).then(({ data }) => {
        setAvailableSlots(data.slots || []);
      }).catch(console.error);
    }
  }, [selectedDate]);

  const toggleService = (id) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleBook = async () => {
    if (!selectedVehicle || !selectedServices.length || !selectedDate || !selectedTime) {
      Alert.alert('提示', '请完整填写预约信息');
      return;
    }
    setLoading(true);
    try {
      await appointmentsAPI.create({
        vehicle_id:       selectedVehicle.id,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        service_type:     selectedServices,
        description,
      });
      Alert.alert(
        '预约成功！',
        `您的预约已提交：${selectedDate} ${selectedTime}\n我们将尽快确认。`,
        [{ text: '确定', onPress: () => navigation.navigate('AppointmentsList') }]
      );
    } catch (err) {
      Alert.alert('预约失败', err.response?.data?.error || '请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const STEPS = ['选择车辆', '选择服务', '选择时间', '确认预约'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep(s => s - 1) : navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {lang === 'zh' ? '在线预约' : 'Book Appointment'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Step indicator */}
      <View style={styles.steps}>
        {STEPS.map((label, i) => (
          <View key={i} style={styles.stepItem}>
            <View style={[styles.stepDot, i + 1 <= step && styles.stepDotActive]}>
              {i + 1 < step
                ? <Ionicons name="checkmark" size={14} color="#fff" />
                : <Text style={[styles.stepNum, i + 1 <= step && styles.stepNumActive]}>{i + 1}</Text>
              }
            </View>
            <Text style={[styles.stepLabel, i + 1 === step && styles.stepLabelActive]}>{label}</Text>
            {i < STEPS.length - 1 && <View style={[styles.stepLine, i + 1 < step && styles.stepLineDone]} />}
          </View>
        ))}
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

        {/* Step 1: Select vehicle */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>选择维修车辆</Text>
            {vehicles.map(v => (
              <TouchableOpacity
                key={v.id}
                style={[styles.vehicleCard, selectedVehicle?.id === v.id && styles.vehicleCardSelected]}
                onPress={() => setSelectedVehicle(v)}
              >
                <Ionicons name="car" size={24} color={selectedVehicle?.id === v.id ? COLORS.primary : COLORS.gray} />
                <View style={styles.vehicleInfo}>
                  <Text style={styles.vehicleName}>{v.nickname || `${v.year} ${v.make} ${v.model}`}</Text>
                  <Text style={styles.vehicleSub}>{v.license_plate || v.color || `${v.make} ${v.model}`}</Text>
                </View>
                {selectedVehicle?.id === v.id && (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
            {vehicles.length === 0 && (
              <TouchableOpacity style={styles.addVehicleBtn} onPress={() => navigation.navigate('AddVehicle')}>
                <Ionicons name="add-circle-outline" size={22} color={COLORS.primary} />
                <Text style={styles.addVehicleText}>添加车辆 / Add Vehicle</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Step 2: Select services */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>选择服务项目（可多选）</Text>
            <View style={styles.servicesGrid}>
              {SERVICE_OPTIONS.map(svc => {
                const active = selectedServices.includes(svc.id);
                return (
                  <TouchableOpacity
                    key={svc.id}
                    style={[styles.serviceChip, active && styles.serviceChipActive]}
                    onPress={() => toggleService(svc.id)}
                  >
                    <Ionicons name={svc.icon} size={20} color={active ? '#fff' : COLORS.primary} />
                    <Text style={[styles.serviceLabel, active && styles.serviceLabelActive]}>
                      {lang === 'zh' ? svc.label_zh : svc.label_en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Step 3: Date & time */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>选择预约日期</Text>
            <Calendar
              minDate={minDate}
              maxDate={maxDate}
              onDayPress={day => { setSelectedDate(day.dateString); setSelectedTime(''); }}
              markedDates={selectedDate ? { [selectedDate]: { selected: true, selectedColor: COLORS.primary } } : {}}
              theme={{
                todayTextColor: COLORS.primary,
                selectedDayBackgroundColor: COLORS.primary,
                arrowColor: COLORS.primary,
                dotColor: COLORS.primary,
              }}
            />

            {selectedDate && (
              <View style={{ marginTop: SPACING.lg }}>
                <Text style={styles.stepTitle}>选择时间段</Text>
                <View style={styles.slotsGrid}>
                  {availableSlots.map(slot => (
                    <TouchableOpacity
                      key={slot.time}
                      style={[
                        styles.timeSlot,
                        !slot.available && styles.timeSlotUnavailable,
                        selectedTime === slot.time && styles.timeSlotSelected,
                      ]}
                      onPress={() => slot.available && setSelectedTime(slot.time)}
                      disabled={!slot.available}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        !slot.available && styles.timeSlotTextDisabled,
                        selectedTime === slot.time && styles.timeSlotTextSelected,
                      ]}>
                        {slot.time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Step 4: Confirm */}
        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>确认预约信息</Text>
            <View style={styles.confirmCard}>
              <ConfirmRow icon="car-outline" label="车辆" value={
                selectedVehicle ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}` : '-'
              } />
              <ConfirmRow icon="construct-outline" label="服务" value={
                selectedServices.map(id => SERVICE_OPTIONS.find(s => s.id === id)?.label_zh).join('、')
              } />
              <ConfirmRow icon="calendar-outline" label="日期" value={selectedDate} />
              <ConfirmRow icon="time-outline" label="时间" value={selectedTime} />
            </View>
            <View style={styles.noticeBox}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.info} />
              <Text style={styles.noticeText}>
                预约成功后将发送确认短信。如需取消，请提前24小时操作。
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        {step < 4 ? (
          <TouchableOpacity
            style={[styles.nextBtn, (!selectedVehicle && step === 1 ||
              !selectedServices.length && step === 2 ||
              (!selectedDate || !selectedTime) && step === 3) && styles.disabled]}
            onPress={() => setStep(s => s + 1)}
          >
            <Text style={styles.nextBtnText}>下一步 Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextBtn} onPress={handleBook} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.nextBtnText}>确认预约 Confirm Booking</Text>
            }
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const ConfirmRow = ({ icon, label, value }) => (
  <View style={styles.confirmRow}>
    <Ionicons name={icon} size={18} color={COLORS.gray} />
    <Text style={styles.confirmLabel}>{label}</Text>
    <Text style={styles.confirmValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.background },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                     paddingTop: 52, paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md,
                     backgroundColor: '#fff', ...SHADOWS.sm },
  headerTitle:     { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.black },
  steps:           { flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
                     paddingVertical: SPACING.md, backgroundColor: '#fff', paddingHorizontal: SPACING.lg },
  stepItem:        { alignItems: 'center', flex: 1, position: 'relative' },
  stepDot:         { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: COLORS.border,
                     justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', marginBottom: 4 },
  stepDotActive:   { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  stepNum:         { fontSize: 11, fontWeight: '700', color: COLORS.gray },
  stepNumActive:   { color: '#fff' },
  stepLabel:       { fontSize: 9, color: COLORS.gray, textAlign: 'center' },
  stepLabelActive: { color: COLORS.primary, fontWeight: '700' },
  stepLine:        { position: 'absolute', top: 13, right: -50, left: 50, height: 2, backgroundColor: COLORS.border },
  stepLineDone:    { backgroundColor: COLORS.primary },
  body:            { flex: 1, padding: SPACING.lg },
  stepTitle:       { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.black, marginBottom: SPACING.md },
  vehicleCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
                     borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm,
                     borderWidth: 2, borderColor: 'transparent', ...SHADOWS.sm },
  vehicleCardSelected: { borderColor: COLORS.primary },
  vehicleInfo:     { flex: 1, marginLeft: SPACING.sm },
  vehicleName:     { fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.black },
  vehicleSub:      { fontSize: FONTS.sizes.sm, color: COLORS.gray, marginTop: 2 },
  addVehicleBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
                     padding: SPACING.md, borderWidth: 1.5, borderStyle: 'dashed',
                     borderColor: COLORS.primary, borderRadius: RADIUS.md },
  addVehicleText:  { color: COLORS.primary, fontSize: FONTS.sizes.md, fontWeight: '600' },
  servicesGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  serviceChip:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10,
                     borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: '#fff' },
  serviceChipActive: { backgroundColor: COLORS.primary },
  serviceLabel:    { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  serviceLabelActive: { color: '#fff' },
  slotsGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeSlot:        { paddingHorizontal: 14, paddingVertical: 10, borderRadius: RADIUS.sm,
                     borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: '#fff' },
  timeSlotSelected: { backgroundColor: COLORS.primary },
  timeSlotUnavailable: { borderColor: COLORS.border, backgroundColor: COLORS.lightGray },
  timeSlotText:    { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  timeSlotTextSelected: { color: '#fff' },
  timeSlotTextDisabled: { color: COLORS.border },
  confirmCard:     { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm, marginBottom: SPACING.md },
  confirmRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
                     borderBottomWidth: 1, borderBottomColor: COLORS.lightGray, gap: 10 },
  confirmLabel:    { width: 40, fontSize: FONTS.sizes.sm, color: COLORS.gray },
  confirmValue:    { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.black, fontWeight: '500' },
  noticeBox:       { flexDirection: 'row', gap: 8, backgroundColor: '#EBF5FB', borderRadius: RADIUS.md, padding: SPACING.md },
  noticeText:      { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.info, lineHeight: 20 },
  bottomBar:       { padding: SPACING.lg, backgroundColor: '#fff', ...SHADOWS.md },
  nextBtn:         { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: 'center' },
  nextBtnText:     { color: '#fff', fontSize: FONTS.sizes.lg, fontWeight: '700' },
  disabled:        { opacity: 0.4 },
});
