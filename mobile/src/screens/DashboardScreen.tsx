import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { fonts } from '../theme';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tenantsApi, unitsApi, paymentsApi, leasesApi, expensesApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { Card, Loader, MetricCard, SectionTitle } from '../components/ui';
import { colors, font, spacing } from '../theme';

const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);
const asArray = (x: any) => (Array.isArray(x) ? x : []);

export default function DashboardScreen() {
  const { displayName, logout } = useAuth();
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefresh]  = useState(false);
  const [stats, setStats] = useState({ gross: 0, expenses: 0, net: 0, roi: '0', tenants: 0, units: 0, occupancy: 0 });
  const [upcoming, setUpcoming]   = useState<any[]>([]);

  const load = useCallback(async () => {
    try {
      const [tR, uR, pR, lR, eR] = await Promise.all([
        tenantsApi.getAll(), unitsApi.getAll(), paymentsApi.getAll(), leasesApi.getAll(), expensesApi.getAll(),
      ]);
      const tenants  = asArray(tR?.data);
      const units    = asArray(uR?.data);
      const payments = asArray(pR?.data);
      const leases   = asArray(lR?.data);
      const expenses = asArray(eR?.data);

      const gross = payments.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + Number(p.amount), 0);
      const exp   = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
      const net   = gross - exp;
      const inv   = units.reduce((s: number, u: any) => s + Number(u.purchase_price || 0), 0);
      const roi   = inv > 0 ? ((net / inv) * 100).toFixed(1) : '0';
      const occ   = units.length === 0 ? 0 :
        Math.round((new Set(leases.filter((l: any) => l.status === 'active').map((l: any) => l.unit_id)).size / units.length) * 100);

      setStats({ gross, expenses: exp, net, roi, tenants: tenants.length, units: units.length, occupancy: occ });

      const now = new Date(), nxt = new Date();
      nxt.setMonth(nxt.getMonth() + 1);
      setUpcoming(
        payments
          .filter((p: any) => { const d = new Date(p.due_date); return d >= now && d <= nxt && p.status !== 'paid'; })
          .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
          .slice(0, 8)
      );
    } catch { Alert.alert('Error', 'Failed to load dashboard data.'); }
    finally { setLoading(false); setRefresh(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <Loader />;

  return (
    <SafeAreaView style={styles.safe} edges={['left','right']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); load(); }} tintColor={colors.accent} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {displayName} 👋</Text>
            <Text style={styles.subGreeting}>Financial Overview</Text>
          </View>
          <TouchableOpacity onPress={() => Alert.alert('Sign out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: logout },
          ])} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Metrics */}
        <View style={styles.metricsGrid}>
          <MetricCard label="Gross Revenue"  value={fmt(stats.gross)}    accent={colors.green} />
          <MetricCard label="Operating Costs" value={fmt(stats.expenses)} accent={colors.red} />
          <MetricCard label="Net Income"      value={fmt(stats.net)}     accent={colors.accentHover} />
          <MetricCard label="Portfolio ROI"   value={`${stats.roi}%`}    accent={colors.yellow} />
        </View>

        {/* Occupancy */}
        <Card style={styles.section}>
          <SectionTitle title="Portfolio" />
          <View style={styles.occupancyRow}>
            <View style={styles.occItem}>
              <Text style={styles.occNum}>{stats.units}</Text>
              <Text style={styles.occLabel}>Total Units</Text>
            </View>
            <View style={styles.occItem}>
              <Text style={styles.occNum}>{stats.tenants}</Text>
              <Text style={styles.occLabel}>Tenants</Text>
            </View>
            <View style={styles.occItem}>
              <Text style={[styles.occNum, { color: stats.occupancy >= 80 ? colors.green : colors.yellow }]}>
                {stats.occupancy}%
              </Text>
              <Text style={styles.occLabel}>Occupied</Text>
            </View>
          </View>
        </Card>

        {/* Upcoming payments */}
        <Card style={styles.section}>
          <SectionTitle title={`Upcoming Payments (${upcoming.length})`} />
          {upcoming.length === 0 ? (
            <Text style={styles.emptyMsg}>No pending payments in the next 30 days.</Text>
          ) : upcoming.map((p: any, i: number) => (
            <View key={i} style={styles.payRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.payName}>{p.lease?.tenant?.full_name ?? 'Tenant'}</Text>
                <Text style={styles.payUnit}>{p.lease?.unit?.name ?? 'Unit'} · {p.due_date}</Text>
              </View>
              <Text style={styles.payAmt}>{Number(p.amount).toFixed(0)} {p.currency ?? 'USD'}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
  greeting:    { fontSize: font.xl, fontFamily: fonts.bold, color: colors.text },
  subGreeting: { fontSize: font.sm, color: colors.text3, marginTop: 2 },
  logoutBtn:   { backgroundColor: colors.redDim, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  logoutText:  { color: colors.red, fontSize: font.xs, fontFamily: fonts.semibold },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  section:     { marginBottom: spacing.md },
  occupancyRow:{ flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.sm },
  occItem:     { alignItems: 'center' },
  occNum:      { fontSize: font.xxl, fontFamily: fonts.bold, color: colors.text },
  occLabel:    { fontSize: font.xs, color: colors.text3, marginTop: 2 },
  emptyMsg:    { color: colors.text3, fontSize: font.sm, marginTop: spacing.sm },
  payRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  payName:     { fontSize: font.sm, fontFamily: fonts.semibold, color: colors.text },
  payUnit:     { fontSize: font.xs, color: colors.text3, marginTop: 2 },
  payAmt:      { fontSize: font.sm, fontFamily: fonts.bold, color: colors.accentHover },
});
