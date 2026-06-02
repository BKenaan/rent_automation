import React, { useState } from 'react';
import { getErrorMessage } from '../../utils/errors';
import { fonts } from '../../theme';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { AlertBox, Button, Input } from '../../components/ui';
import Logo from '../../components/Logo';
import { colors, font, spacing } from '../../theme';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password) { setError('Please enter your username or email and password.'); return; }
    setError(''); setLoading(true);
    try {
      await login(identifier.trim(), password);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Invalid credentials. Please try again.'));
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Logo area */}
          <View style={styles.header}>
            <Logo size={60} withBadge />
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to your RentalMan account</Text>
          </View>

          {error && <AlertBox message={error} />}

          <Input
            label="Username or Email"
            placeholder="your username or email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={identifier}
            onChangeText={setIdentifier}
          />
          <Input
            label="Password"
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotWrap}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </TouchableOpacity>

          <Button label={loading ? 'Signing in…' : 'Sign in'} loading={loading} size="lg" onPress={handleLogin} style={{ marginTop: spacing.sm }} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Create account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: spacing.xxl, justifyContent: 'center' },
  header:    { alignItems: 'center', marginBottom: spacing.xxl + 8 },
  logoBox: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: colors.accentDim,
    borderWidth: 1, borderColor: colors.accentBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  logoText:   { fontSize: font.xl, fontFamily: fonts.extrabold, color: colors.accentHover },
  title:      { fontSize: font.xxl, fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.5 },
  subtitle:   { fontSize: font.sm, color: colors.text2, marginTop: 4 },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: spacing.md },
  forgot:     { fontSize: font.sm, color: colors.accentHover, fontFamily: fonts.medium },
  footer:     { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  footerText: { color: colors.text2, fontSize: font.sm },
  footerLink: { color: colors.accentHover, fontSize: font.sm, fontFamily: fonts.semibold },
});
