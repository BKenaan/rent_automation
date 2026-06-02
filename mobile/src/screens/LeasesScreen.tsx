import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Modal, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { leasesApi, tenantsApi, unitsApi } from '../api';
import { AlertBox, Badge, Button, Card, EmptyState, Input, Loader } from '../components/ui';
import { colors, font, radius, spacing } from '../theme';

const FREQS = [
  { label: 'Monthly',     value: '1' },
  { label: 'Quarterly',   value: '3' },
  { label: 'Biannually',  value: '6' },
  { label: 'Yearly',      value: '12' },
];

const BLANK = {
  tenant_id: '', unit_id: '', start_date: '', end_date: '',
  rent_amount: '', currency: 'USD', payment_frequency_months: '1', deposit_amount: '0',
};

function leaseStatus(l: any): { label: string; variant: 'green' | 'yellow' | 'red' } {
  const now = new Date();
  const start = new Date(l.start_date);
  const end = new Date(l.end_date);
  if (now < start) return { label: 'Upcoming', variant: 'yellow' };
  if (now > end)   return { label: 'Expired',  variant: 'red' };
  return { label: 'Active', variant: 'green' };
}

export default function LeasesScreen() {
  const [leases, setLeases]       = useState<any[]>([]);
  const [tenants, setTenants]     = useState<any[]>([]);
  const [units, setUnits]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefresh]  = useState(false);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState<any>(null);
  const [form, setForm]           = useState(BLANK);
  const [submitting, setSubmit]   = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    try {
      const [lR, tR, uR] = await Promise.all([leasesApi.getAll(), tenantsApi.getAll(), unitsApi.getAll()]);
      setLeases(lR?.data ?? []); setTenants(tR?.data ?? []); setUnits(uR?.data ?? []);
    } catch { Alert.alert('Error', 'Failed to load leases.'); }
    finally { setLoading(false); setRefresh(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const tenantName = (id: number) => tenants.find((t: any) => t.id === id)?.full_name ?? `Tenant #${id}`;
  const unitLabel  = (id: number) => {
    const u = units.find((x: any) => x.id === id);
    return u ? `${u.name} (${u.unit_code})` : `Unit #${id}`;
  };

  const openCreate = () => { setEditing(null); setForm(BLANK); setFormError(''); setModal(true); };
  const openEdit   = (l: any) => {
    setEditing(l);
    setForm({
      tenant_id: String(l.tenant_id), unit_id: String(l.unit_id),
      start_date: l.start_date, end_date: l.end_date,
      rent_amount: String(l.rent_amount), currency: l.currency || 'USD',
      payment_frequency_months: String(l.payment_frequency_months),
      deposit_amount: String(l.deposit_amount ?? 0),
    });
    setFormError(''); setModal(true);
  };

  const handleDelete = (id: number) => Alert.alert('Delete lease', 'This will also remove all associated payment schedules. Continue?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await leasesApi.delete(id); load(); }
      catch { Alert.alert('Error', 'Failed to delete lease.'); }
    }},
  ]);

  const handleSubmit = async () => {
    if (!form.tenant_id || !form.unit_id) { setFormError('Please select a tenant and a unit.'); return; }
    if (!form.start_date || !form.end_date) { setFormError('Start and end dates are required (YYYY-MM-DD).'); return; }
    if (!form.rent_amount) { setFormError('Rent amount is required.'); return; }
    setSubmit(true); setFormError('');
    try {
      const payload = {
        tenant_id: Number(form.tenant_id), unit_id: Number(form.unit_id),
        start_date: form.start_date, end_date: form.end_date,
        rent_amount: Number(form.rent_amount), currency: form.currency || 'USD',
        payment_frequency_months: Number(form.payment_frequency_months),
        deposit_amount: Number(form.deposit_amount || 0),
      };
      if (editing) await leasesApi.update(editing.id, payload);
      else await leasesApi.create(payload);
      setModal(false); load();
    } catch (e: any) {
      setFormError(e.response?.data?.detail ?? 'Failed to save lease. Check the dates and values.');
    } finally { setSubmit(false); }
  };

  if (loading) return <Loader />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.count}>{leases.length} lease{leases.length === 1 ? '' : 's'}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}><Text style={styles.addBtnText}>+ New Lease</Text></TouchableOpacity>
      </View>

      <FlatList
        data={leases}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); load(); }} tintColor={colors.accent} />}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 32 }}
        ListEmptyComponent={<EmptyState message="No leases yet. Tap + New Lease — payment schedules are generated automatically." />}
        renderItem={({ item }) => {
          const st = leaseStatus(item);
          return (
            <Card style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tenant}>{tenantName(item.tenant_id)}</Text>
                  <Text style={styles.unit}>{unitLabel(item.unit_id)}</Text>
                </View>
                <Badge label={st.label} variant={st.variant} />
              </View>

              <View style={styles.metaRow}>
                <View style={styles.meta}>
                  <Text style={styles.metaLabel}>Rent</Text>
                  <Text style={styles.metaValue}>{item.rent_amount} {item.currency}</Text>
                </View>
                <View style={styles.meta}>
                  <Text style={styles.metaLabel}>Frequency</Text>
                  <Text style={styles.metaValue}>{FREQS.find(f => f.value === String(item.payment_frequency_months))?.label ?? `${item.payment_frequency_months}mo`}</Text>
                </View>
                <View style={styles.meta}>
                  <Text style={styles.metaLabel}>Schedules</Text>
                  <Text style={styles.metaValue}>{item.payment_schedules?.length ?? 0}</Text>
                </View>
              </View>

              <Text style={styles.period}>{item.start_date}  →  {item.end_date}</Text>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}><Text style={styles.actionEdit}>Edit</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.actionDanger]} onPress={() => handleDelete(item.id)}><Text style={styles.actionDeleteText}>Delete</Text></TouchableOpacity>
              </View>
            </Card>
          );
        }}
      />

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Lease' : 'New Lease'}</Text>
            <TouchableOpacity onPress={() => setModal(false)}><Text style={styles.modalClose}>Cancel</Text></TouchableOpacity>
          </View>
          <FlatList
            data={[1]}
            keyExtractor={() => 'form'}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: spacing.lg }}
            renderItem={() => (
              <View>
                {formError ? <AlertBox message={formError} /> : null}

                <Text style={styles.selectLabel}>Tenant</Text>
                <View style={styles.chipRow}>
                  {tenants.length === 0
                    ? <Text style={styles.hint}>No tenants yet — add one first.</Text>
                    : tenants.map((t: any) => (
                      <TouchableOpacity key={t.id} style={[styles.chip, form.tenant_id === String(t.id) && styles.chipActive]} onPress={() => setForm({ ...form, tenant_id: String(t.id) })}>
                        <Text style={[styles.chipText, form.tenant_id === String(t.id) && styles.chipActiveText]}>{t.full_name}</Text>
                      </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.selectLabel}>Unit</Text>
                <View style={styles.chipRow}>
                  {units.length === 0
                    ? <Text style={styles.hint}>No units yet — add one first.</Text>
                    : units.map((u: any) => (
                      <TouchableOpacity key={u.id} style={[styles.chip, form.unit_id === String(u.id) && styles.chipActive]} onPress={() => setForm({ ...form, unit_id: String(u.id) })}>
                        <Text style={[styles.chipText, form.unit_id === String(u.id) && styles.chipActiveText]}>{u.name}</Text>
                      </TouchableOpacity>
                    ))}
                </View>

                <Input label="Start Date" placeholder="YYYY-MM-DD" value={form.start_date} onChangeText={v => setForm({ ...form, start_date: v })} />
                <Input label="End Date" placeholder="YYYY-MM-DD" value={form.end_date} onChangeText={v => setForm({ ...form, end_date: v })} />
                <Input label="Rent Amount" placeholder="0.00" keyboardType="decimal-pad" value={form.rent_amount} onChangeText={v => setForm({ ...form, rent_amount: v })} />
                <Input label="Currency" placeholder="USD" autoCapitalize="characters" value={form.currency} onChangeText={v => setForm({ ...form, currency: v.toUpperCase() })} />

                <Text style={styles.selectLabel}>Payment Frequency</Text>
                <View style={styles.chipRow}>
                  {FREQS.map(f => (
                    <TouchableOpacity key={f.value} style={[styles.chip, form.payment_frequency_months === f.value && styles.chipActive]} onPress={() => setForm({ ...form, payment_frequency_months: f.value })}>
                      <Text style={[styles.chipText, form.payment_frequency_months === f.value && styles.chipActiveText]}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Input label="Deposit Amount" placeholder="0.00" keyboardType="decimal-pad" value={form.deposit_amount} onChangeText={v => setForm({ ...form, deposit_amount: v })} />

                <Button label={submitting ? 'Saving…' : editing ? 'Update Lease' : 'Create Lease'} loading={submitting} size="lg" onPress={handleSubmit} style={{ marginTop: spacing.sm }} />
              </View>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  topBar:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.sm },
  count:   { fontSize: font.sm, color: colors.text3, fontWeight: '500' },
  addBtn:  { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 7 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: font.sm },
  card:    { marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  tenant:  { fontSize: font.md, fontWeight: '700', color: colors.text },
  unit:    { fontSize: font.sm, color: colors.text3, marginTop: 2 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  meta:    { alignItems: 'center', flex: 1 },
  metaLabel: { fontSize: 10, color: colors.text3, textTransform: 'uppercase', letterSpacing: 0.5 },
  metaValue: { fontSize: font.sm, fontWeight: '600', color: colors.text, marginTop: 2 },
  period:  { fontSize: font.sm, color: colors.text2, marginTop: spacing.sm, marginBottom: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn:   { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderMd },
  actionEdit:  { color: colors.accentHover, fontWeight: '600', fontSize: font.sm },
  actionDanger: { backgroundColor: colors.redDim, borderColor: 'transparent' },
  actionDeleteText: { color: colors.red, fontWeight: '600', fontSize: font.sm },
  modalSafe:   { flex: 1, backgroundColor: colors.surface1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle:  { fontSize: font.lg, fontWeight: '700', color: colors.text },
  modalClose:  { color: colors.accentHover, fontSize: font.md, fontWeight: '500' },
  selectLabel: { fontSize: font.sm, color: colors.text2, fontWeight: '500', marginBottom: spacing.sm },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip:        { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderMd },
  chipActive:  { backgroundColor: colors.accentDim, borderColor: colors.accentBorder },
  chipText:    { fontSize: font.sm, color: colors.text2 },
  chipActiveText: { color: colors.accentHover, fontWeight: '600' },
  hint:        { fontSize: font.sm, color: colors.text3, fontStyle: 'italic' },
});
