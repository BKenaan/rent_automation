import React, { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../utils/errors';
import { fonts } from '../theme';
import { Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { paymentsApi } from '../api';
import { AlertBox, Badge, Button, Card, EmptyState, Input, Loader } from '../components/ui';
import DateField from '../components/DateField';
import { colors, font, radius, spacing } from '../theme';

function statusVariant(s: string): 'green' | 'yellow' | 'red' | 'neutral' {
  return s === 'paid' ? 'green' : s === 'overdue' ? 'red' : 'yellow';
}

const METHODS = ['Bank Transfer', 'Cash', 'Check', 'Credit Card', 'Other'];

export default function PaymentsScreen() {
  const [payments, setPayments]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefresh]  = useState(false);
  const [recording, setRecording] = useState<any>(null);
  const [form, setForm]           = useState({ payment_method: 'Bank Transfer', reference: '', notes: '', paid_at: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmit]   = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    try { setPayments((await paymentsApi.getAll())?.data ?? []); }
    catch { Alert.alert('Error', 'Failed to load payments.'); }
    finally { setLoading(false); setRefresh(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openRecord = (p: any) => {
    setRecording(p);
    setForm({ payment_method: 'Bank Transfer', reference: '', notes: '', paid_at: new Date().toISOString().split('T')[0] });
    setFormError('');
  };

  const handleRecord = async () => {
    if (!form.paid_at) { setFormError('Please enter the payment date.'); return; }
    setSubmit(true); setFormError('');
    try {
      await paymentsApi.record(recording.id, form);
      setRecording(null); load();
    } catch (e: any) { setFormError(getErrorMessage(e, 'Failed to record payment.')); }
    finally { setSubmit(false); }
  };

  const summary = { paid: 0, pending: 0, overdue: 0 };
  payments.forEach((p: any) => { if ((summary as any)[p.status] !== undefined) (summary as any)[p.status]++; });

  if (loading) return <Loader />;

  return (
    <SafeAreaView style={styles.safe} edges={['left','right']}>
      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}><Text style={[styles.summaryNum, { color: colors.green }]}>{summary.paid}</Text><Text style={styles.summaryLabel}>Paid</Text></View>
        <View style={styles.summaryItem}><Text style={[styles.summaryNum, { color: colors.yellow }]}>{summary.pending}</Text><Text style={styles.summaryLabel}>Pending</Text></View>
        <View style={styles.summaryItem}><Text style={[styles.summaryNum, { color: colors.red }]}>{summary.overdue}</Text><Text style={styles.summaryLabel}>Overdue</Text></View>
      </View>

      <FlatList
        data={payments}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); load(); }} tintColor={colors.accent} />}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 32 }}
        ListEmptyComponent={<EmptyState message="No payment records found. Create a lease to generate schedules." />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tenant}>{item.lease?.tenant?.full_name ?? '—'}</Text>
                <Text style={styles.unit}>{item.lease?.unit?.name ?? '—'} · {item.due_date}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.amount}>{Number(item.amount).toFixed(2)} {item.currency ?? 'USD'}</Text>
                <Badge label={item.status} variant={statusVariant(item.status)} />
              </View>
            </View>
            {item.status !== 'paid' && (
              <TouchableOpacity style={styles.recordBtn} onPress={() => openRecord(item)}>
                <Text style={styles.recordBtnText}>Record Payment</Text>
              </TouchableOpacity>
            )}
            {item.status === 'paid' && item.payment_method && (
              <Text style={styles.via}>via {item.payment_method}</Text>
            )}
          </Card>
        )}
      />

      {/* Record Modal */}
      <Modal visible={!!recording} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setRecording(null)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <TouchableOpacity onPress={() => setRecording(null)}><Text style={styles.modalClose}>Cancel</Text></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {recording && (
              <Card style={{ marginBottom: spacing.md }}>
                <Text style={styles.infoLabel}>Tenant</Text>
                <Text style={styles.infoValue}>{recording.lease?.tenant?.full_name}</Text>
                <Text style={styles.infoLabel}>Amount Due</Text>
                <Text style={[styles.infoValue, { color: colors.accentHover }]}>{recording.amount} {recording.currency ?? 'USD'}</Text>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>{recording.due_date}</Text>
              </Card>
            )}
            {formError && <AlertBox message={formError} />}

            <Text style={styles.inputLabel}>Payment Method</Text>
            <View style={styles.methods}>
              {METHODS.map(m => (
                <TouchableOpacity key={m} style={[styles.methodBtn, form.payment_method === m && styles.methodActive]} onPress={() => setForm({ ...form, payment_method: m })}>
                  <Text style={[styles.methodText, form.payment_method === m && styles.methodActiveText]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <DateField label="Payment Date" value={form.paid_at} onChange={v => setForm({ ...form, paid_at: v })} />
            <Input label="Reference # (optional)" placeholder="Transaction ID, Receipt #…" value={form.reference} onChangeText={v => setForm({ ...form, reference: v })} />
            <Input label="Notes (optional)" placeholder="Internal notes…" multiline value={form.notes} onChangeText={v => setForm({ ...form, notes: v })} />
            <Button label={submitting ? 'Recording…' : 'Confirm Payment'} loading={submitting} size="lg" onPress={handleRecord} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  summary: { flexDirection: 'row', justifyContent: 'space-around', padding: spacing.lg, backgroundColor: colors.surface1, borderBottomWidth: 1, borderBottomColor: colors.border },
  summaryItem:  { alignItems: 'center' },
  summaryNum:   { fontSize: font.xxl, fontFamily: fonts.extrabold },
  summaryLabel: { fontSize: font.xs, color: colors.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  card:    { marginBottom: spacing.sm },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tenant:  { fontSize: font.md, fontFamily: fonts.semibold, color: colors.text },
  unit:    { fontSize: font.sm, color: colors.text3, marginTop: 2 },
  amount:  { fontSize: font.md, fontFamily: fonts.bold, color: colors.text, marginBottom: 4 },
  recordBtn:     { marginTop: spacing.md, backgroundColor: colors.accentDim, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.accentBorder },
  recordBtnText: { color: colors.accentHover, fontFamily: fonts.semibold, fontSize: font.sm },
  via:           { marginTop: spacing.sm, fontSize: font.xs, color: colors.text3 },
  modalSafe:     { flex: 1, backgroundColor: colors.surface1 },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle:    { fontSize: font.lg, fontFamily: fonts.bold, color: colors.text },
  modalClose:    { color: colors.accentHover, fontSize: font.md, fontFamily: fonts.medium },
  modalBody:     { padding: spacing.lg },
  infoLabel:     { fontSize: font.xs, color: colors.text3, marginTop: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue:     { fontSize: font.md, fontFamily: fonts.semibold, color: colors.text, marginTop: 2 },
  inputLabel:    { fontSize: font.sm, color: colors.text2, marginBottom: 8, fontFamily: fonts.medium },
  methods:       { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  methodBtn:     { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderMd },
  methodActive:  { backgroundColor: colors.accentDim, borderColor: colors.accentBorder },
  methodText:    { fontSize: font.sm, color: colors.text2 },
  methodActiveText: { color: colors.accentHover, fontFamily: fonts.semibold },
});
