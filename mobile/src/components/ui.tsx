/**
 * Shared UI primitives used across all screens.
 */
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, font, fonts, radius, spacing } from '../theme';

// ── Card ──────────────────────────────────────────────────────────────────────
export const Card: React.FC<{ style?: ViewStyle; children: React.ReactNode }> = ({ style, children }) => (
  <View style={[styles.card, style]}>{children}</View>
);

// ── Button ────────────────────────────────────────────────────────────────────
interface BtnProps extends TouchableOpacityProps {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<BtnProps> = ({
  label, loading, variant = 'primary', size = 'md', disabled, style, ...rest
}) => {
  const bg =
    variant === 'primary'   ? colors.accent :
    variant === 'secondary' ? colors.surface3 :
    variant === 'danger'    ? colors.redDim :
    'transparent';
  const fc =
    variant === 'primary'   ? '#fff' :
    variant === 'danger'    ? colors.red :
    colors.text2;
  const pad = size === 'sm' ? 8 : size === 'lg' ? 14 : 11;
  const fs  = size === 'sm' ? font.sm : size === 'lg' ? font.md : font.sm;

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: bg, paddingVertical: pad, opacity: disabled || loading ? 0.5 : 1 }, style]}
      disabled={disabled || loading}
      activeOpacity={0.75}
      {...rest}
    >
      {loading
        ? <ActivityIndicator color={fc} size="small" />
        : <Text style={[styles.btnLabel, { color: fc, fontSize: fs }]}>{label}</Text>
      }
    </TouchableOpacity>
  );
};

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, style, ...rest }) => (
  <View style={{ marginBottom: spacing.md }}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <TextInput
      style={[styles.input, error ? styles.inputError : undefined, style]}
      placeholderTextColor={colors.text3}
      selectionColor={colors.accent}
      {...rest}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ── Badge ─────────────────────────────────────────────────────────────────────
type BadgeVariant = 'green' | 'yellow' | 'red' | 'neutral';
export const Badge: React.FC<{ label: string; variant?: BadgeVariant }> = ({ label, variant = 'neutral' }) => {
  const bg = variant === 'green'   ? colors.greenDim  :
             variant === 'yellow'  ? colors.yellowDim :
             variant === 'red'     ? colors.redDim    :
             colors.surface3;
  const fc = variant === 'green'   ? colors.green  :
             variant === 'yellow'  ? colors.yellow :
             variant === 'red'     ? colors.red    :
             colors.text2;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fc }]}>{label.toUpperCase()}</Text>
    </View>
  );
};

// ── EmptyState ────────────────────────────────────────────────────────────────
export const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

// ── Screen loader ─────────────────────────────────────────────────────────────
export const Loader: React.FC = () => (
  <View style={styles.loader}>
    <ActivityIndicator color={colors.accent} size="large" />
  </View>
);

// ── Section header ────────────────────────────────────────────────────────────
export const SectionTitle: React.FC<{ title: string; style?: TextStyle }> = ({ title, style }) => (
  <Text style={[styles.sectionTitle, style]}>{title}</Text>
);

// ── Row item (list row) ───────────────────────────────────────────────────────
export const RowItem: React.FC<{
  title: string; subtitle?: string; right?: React.ReactNode; onPress?: () => void;
}> = ({ title, subtitle, right, onPress }) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress}>
    <View style={{ flex: 1 }}>
      <Text style={styles.rowTitle}>{title}</Text>
      {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
    </View>
    {right && <View style={{ marginLeft: spacing.sm }}>{right}</View>}
  </TouchableOpacity>
);

// ── Alert box ─────────────────────────────────────────────────────────────────
export const AlertBox: React.FC<{ message: string; variant?: 'error' | 'success' }> = ({
  message, variant = 'error',
}) => (
  <View style={[styles.alertBox, { backgroundColor: variant === 'error' ? colors.redDim : colors.greenDim,
    borderColor: variant === 'error' ? colors.red : colors.green }]}>
    <Text style={[styles.alertText, { color: variant === 'error' ? colors.red : colors.green }]}>{message}</Text>
  </View>
);

// ── Metric card ───────────────────────────────────────────────────────────────
export const MetricCard: React.FC<{ label: string; value: string; accent?: string }> = ({
  label, value, accent = colors.text,
}) => (
  <Card style={styles.metric}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
  </Card>
);

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  btn: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  btnLabel: { fontFamily: fonts.semibold, letterSpacing: 0.2 },
  inputLabel: {
    fontSize: font.sm,
    color: colors.text2,
    marginBottom: 6,
    fontFamily: fonts.medium,
  },
  input: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderMd,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: font.md,
    fontFamily: fonts.regular,
  },
  inputError: { borderColor: colors.red },
  errorText: { color: colors.red, fontSize: font.xs, marginTop: 4, fontFamily: fonts.regular },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 10, fontFamily: fonts.bold, letterSpacing: 0.5 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText:  { color: colors.text3, fontSize: font.md, textAlign: 'center', fontFamily: fonts.regular, lineHeight: 22 },
  loader:     { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  sectionTitle: {
    fontSize: font.sm,
    fontFamily: fonts.bold,
    color: colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowTitle: { fontSize: font.md, color: colors.text, fontFamily: fonts.medium },
  rowSub:   { fontSize: font.sm, color: colors.text3, marginTop: 2, fontFamily: fonts.regular },
  alertBox: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  alertText: { fontSize: font.sm, lineHeight: 20, fontFamily: fonts.regular },
  metric: { flex: 1, minWidth: '45%' },
  metricLabel: { fontSize: 10, color: colors.text3, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: fonts.semibold },
  metricValue: { fontSize: font.xl, fontFamily: fonts.extrabold, marginTop: 4, letterSpacing: -0.5 },
});
