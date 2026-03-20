import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Image, KeyboardAvoidingView, Platform,
  ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../store/slices/authSlice';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector(s => s.auth);
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password) {
      Alert.alert('提示', '请填写手机号和密码 / Please enter phone and password');
      return;
    }
    dispatch(clearError());
    const result = await dispatch(login({ phone: phone.trim(), password }));
    if (result.type === 'auth/login/rejected') {
      Alert.alert('登录失败 / Login Failed', result.payload);
    }
  };

  const handleOTPLogin = () => navigation.navigate('OTP');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <LinearGradient colors={COLORS.primaryGradient} style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>CHP</Text>
            <Text style={styles.logoSub}>Auto Service</Text>
          </View>
          <Text style={styles.tagline}>18年专业汽车维修 · 客户至上</Text>
          <Text style={styles.taglineSub}>18 Years of Trusted Auto Service</Text>
        </LinearGradient>

        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>欢迎回来 / Welcome Back</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>手机号 Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+61 4XX XXX XXX"
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>密码 Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="请输入密码 / Enter password"
                secureTextEntry={!showPass}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                <Text style={styles.eyeText}>{showPass ? '隐藏' : '显示'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('OTP', { mode: 'forgot' })}>
            <Text style={styles.forgotText}>忘记密码？/ Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginBtn, isLoading && styles.disabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <LinearGradient colors={COLORS.primaryGradient} style={styles.loginGradient}>
              <Text style={styles.loginBtnText}>
                {isLoading ? '登录中... / Signing in...' : '登录 / Sign In'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>或 / OR</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity style={styles.otpBtn} onPress={handleOTPLogin}>
            <Text style={styles.otpBtnText}>短信验证码登录 / Login with SMS OTP</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>
              还没有账号？
              <Text style={styles.registerTextBold}> 立即注册 / Register</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:      { flexGrow: 1, backgroundColor: COLORS.background },
  header:         { paddingTop: 60, paddingBottom: 40, paddingHorizontal: SPACING.lg, alignItems: 'center' },
  logoContainer:  { alignItems: 'center', marginBottom: SPACING.sm },
  logoText:       { fontSize: 48, fontWeight: '900', color: '#fff', letterSpacing: 4 },
  logoSub:        { fontSize: 16, color: 'rgba(255,255,255,0.85)', letterSpacing: 2, marginTop: -4 },
  tagline:        { color: COLORS.secondary, fontSize: 13, fontWeight: '600', marginTop: SPACING.md },
  taglineSub:     { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },
  formContainer:  { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
                    marginTop: -20, padding: SPACING.lg, ...SHADOWS.md },
  formTitle:      { fontSize: FONTS.sizes.xxl, fontWeight: '700', color: COLORS.black, marginBottom: SPACING.lg },
  inputGroup:     { marginBottom: SPACING.md },
  label:          { fontSize: FONTS.sizes.sm, color: COLORS.gray, marginBottom: 6, fontWeight: '500' },
  input:          { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: 14,
                    paddingVertical: 12, fontSize: FONTS.sizes.md, color: COLORS.black, backgroundColor: COLORS.lightGray },
  passwordRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn:         { paddingHorizontal: 12, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border,
                    borderRadius: RADIUS.md, backgroundColor: COLORS.lightGray },
  eyeText:        { fontSize: FONTS.sizes.sm, color: COLORS.gray },
  forgotText:     { color: COLORS.primary, fontSize: FONTS.sizes.sm, textAlign: 'right', marginBottom: SPACING.lg },
  loginBtn:       { borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.md },
  loginGradient:  { paddingVertical: 15, alignItems: 'center' },
  loginBtnText:   { color: '#fff', fontSize: FONTS.sizes.lg, fontWeight: '700' },
  disabled:       { opacity: 0.6 },
  divider:        { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.md },
  line:           { flex: 1, height: 1, backgroundColor: COLORS.border },
  orText:         { marginHorizontal: SPACING.sm, color: COLORS.gray, fontSize: FONTS.sizes.sm },
  otpBtn:         { borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14,
                    alignItems: 'center', marginBottom: SPACING.lg },
  otpBtnText:     { color: COLORS.primary, fontSize: FONTS.sizes.md, fontWeight: '600' },
  registerLink:   { alignItems: 'center', paddingVertical: SPACING.sm },
  registerText:   { color: COLORS.gray, fontSize: FONTS.sizes.md },
  registerTextBold: { color: COLORS.primary, fontWeight: '700' },
});
