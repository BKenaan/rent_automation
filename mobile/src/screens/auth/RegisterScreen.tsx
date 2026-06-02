import React, { useState } from 'react';
import { fonts } from '../../theme';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { AlertBox, Button, Input } from '../../components/ui';
import { colors, font, spacing } from '../../theme';

function validatePassword(pwd: string): string | null {
  if (pwd.length < 8)        return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(pwd))    return 'Password must contain an uppercase letter';
  if (!/\d/.test(pwd))       return 'Password must contain a digit';
  return null;
}

export default function RegisterScreen({ navigation }: any) {
  const { register, login } = useAuth();
  const [form, setForm] = useState({ username: '', full_name: '', email: '', password: '', confirm: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (val: string) => setForm({ ...form, [key]: val });

  const handleRegister = async () => {
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    const pwdErr = validatePassword(form.password);
    if (pwdErr) { setError(pwdErr); return; }
    setError(''); setLoading(true);
    try {
      await register({ username: form.username, full_name: form.full_name, email: form.email, password: form.password });
      await login(form.username, form.password);
    } catch (err: any) {
      setError(err.response?.data?.detail ?? 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoBox}><Text style={styles.logoText}>RM</Text></View>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Start managing your portfolio</Text>
          </View>

          {error && <AlertBox message={error} />}

          <Input label="Username" placeholder="johnsmith" autoCapitalize="none" value={form.username} onChangeText={set('username')} />
          <Input label="Full Name" placeholder="John Smith" value={form.full_name} onChangeText={set('full_name')} />
          <Input label="Email" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={set('email')} />
          <Input label="Password" placeholder="Min 8 chars, 1 uppercase, 1 digit" secureTextEntry value={form.password} onChangeText={set('password')} />
          <Input label="Confirm Password" placeholder="••••••••" secureTextEntry value={form.confirm} onChangeText={set('confirm')} onSubmitEditing={handleRegister} />

          <Button label={loading ? 'Creating…' : 'Create account'} loading={loading} size="lg" onPress={handleRegister} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: spacing.xxl },
  header:    { alignItems: 'center', marginBottom: spacing.xxl, marginTop: spacing.xl },
  logoBox: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: colors.accentDim, borderWidth: 1, borderColor: colors.accentBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  logoText:   { fontSize: font.xl, fontFamily: fonts.extrabold, color: colors.accentHover },
  title:      { fontSize: font.xxl, fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.5 },
  subtitle:   { fontSize: font.sm, color: colors.text2, marginTop: 4 },
  footer:     { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { color: colors.text2, fontSize: font.sm },
  footerLink: { color: colors.accentHover, fontSize: font.sm, fontFamily: fonts.semibold },
});
