import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { authApi } from '../../api';
import { AlertBox, Button, Input } from '../../components/ui';
import { colors, font, spacing } from '../../theme';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  const handleSubmit = async () => {
    if (!email) { setError('Please enter your email address'); return; }
    setError(''); setLoading(true);
    try { await authApi.forgotPassword(email); setSent(true); }
    catch (err: any) { setError(err.response?.data?.detail ?? 'Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <View style={styles.logoBox}><Text style={styles.logoText}>RM</Text></View>
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.subtitle}>We'll send a reset link to your email</Text>
          </View>

          {sent ? (
            <AlertBox variant="success" message="If that email is registered, you'll receive a reset link. Check your inbox and spam folder." />
          ) : (
            <>
              {error && <AlertBox message={error} />}
              <Input label="Email address" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} onSubmitEditing={handleSubmit} />
              <Button label={loading ? 'Sending…' : 'Send reset link'} loading={loading} size="lg" onPress={handleSubmit} />
            </>
          )}

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.back}>
            <Text style={styles.backText}>← Back to sign in</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  container: { flexGrow: 1, padding: spacing.xxl, justifyContent: 'center' },
  header:    { alignItems: 'center', marginBottom: spacing.xxl },
  logoBox: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: colors.accentDim, borderWidth: 1, borderColor: colors.accentBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
  },
  logoText: { fontSize: font.xl, fontWeight: '800', color: colors.accentHover },
  title:    { fontSize: font.xxl, fontWeight: '700', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: font.sm, color: colors.text2, marginTop: 4 },
  back:     { alignItems: 'center', marginTop: spacing.xl },
  backText: { color: colors.text2, fontSize: font.sm },
});
