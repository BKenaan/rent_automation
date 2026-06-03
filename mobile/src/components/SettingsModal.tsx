import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Bell, LogOut } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';
import { colors, font, fonts, radius, spacing } from '../theme';

const Row: React.FC<{
  icon: React.ReactNode; title: string; subtitle: string;
  value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean;
}> = ({ icon, title, subtitle, value, onValueChange, disabled }) => (
  <View style={styles.row}>
    <View style={styles.rowIcon}>{icon}</View>
    <View style={{ flex: 1 }}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowSub}>{subtitle}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.surface3, true: colors.accent }}
      thumbColor="#fff"
    />
  </View>
);

export default function SettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { user, displayName, updatePreferences, logout } = useAuth();
  const [saving, setSaving] = useState(false);

  const setPref = async (key: 'notify_email' | 'notify_push', val: boolean) => {
    if (!user) return;
    setSaving(true);
    try {
      await updatePreferences({
        notify_email: key === 'notify_email' ? val : user.notify_email,
        notify_push: key === 'notify_push' ? val : user.notify_push,
      });
    } catch (e: any) {
      Alert.alert('Error', getErrorMessage(e, 'Could not save your preference.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => { onClose(); logout(); } },
    ]);
  };

  const initials = displayName ? displayName.slice(0, 2).toUpperCase() : 'RM';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.close}>Done</Text></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          {/* Profile */}
          <View style={styles.profile}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{displayName}</Text>
              {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
            </View>
          </View>

          <Text style={styles.sectionLabel}>Notifications</Text>
          <Text style={styles.sectionHint}>
            Choose how RentalMan alerts you about overdue payments, upcoming rent, and expiring leases.
          </Text>

          <View style={styles.card}>
            <Row
              icon={<Mail size={18} color={colors.accentHover} />}
              title="Email notifications"
              subtitle="Daily summary by email"
              value={!!user?.notify_email}
              onValueChange={(v) => setPref('notify_email', v)}
              disabled={saving}
            />
            <View style={styles.divider} />
            <Row
              icon={<Bell size={18} color={colors.accentHover} />}
              title="Push notifications"
              subtitle="Alerts on this device"
              value={!!user?.notify_push}
              onValueChange={(v) => setPref('notify_push', v)}
              disabled={saving}
            />
          </View>

          <TouchableOpacity style={styles.signOut} onPress={confirmLogout}>
            <LogOut size={17} color={colors.red} />
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: colors.bg },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: font.lg, fontFamily: fonts.bold, color: colors.text },
  close:       { color: colors.accentHover, fontSize: font.md, fontFamily: fonts.semibold },
  profile:     { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  avatar:      { width: 52, height: 52, borderRadius: radius.full, backgroundColor: colors.accentDim, borderWidth: 1, borderColor: colors.accentBorder, alignItems: 'center', justifyContent: 'center' },
  avatarText:  { color: colors.accentHover, fontFamily: fonts.bold, fontSize: font.lg },
  name:        { fontSize: font.lg, fontFamily: fonts.bold, color: colors.text },
  email:       { fontSize: font.sm, color: colors.text2, marginTop: 2 },
  sectionLabel:{ fontSize: font.sm, fontFamily: fonts.bold, color: colors.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  sectionHint: { fontSize: font.sm, color: colors.text3, lineHeight: 19, marginBottom: spacing.md },
  card:        { backgroundColor: colors.surface1, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg },
  row:         { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  rowIcon:     { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center' },
  rowTitle:    { fontSize: font.md, fontFamily: fonts.semibold, color: colors.text },
  rowSub:      { fontSize: font.xs, color: colors.text3, marginTop: 2 },
  divider:     { height: 1, backgroundColor: colors.border },
  signOut:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.redDim, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  signOutText: { color: colors.red, fontFamily: fonts.semibold, fontSize: font.md },
});
