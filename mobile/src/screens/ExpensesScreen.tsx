import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getErrorMessage } from '../utils/errors';
import { fonts } from '../theme';
import { Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { expensesApi, unitsApi } from '../api';
import { AlertBox, Badge, Button, Card, EmptyState, Input, Loader } from '../components/ui';
import DateField from '../components/DateField';
import { colors, font, radius, spacing } from '../theme';

const CATS = ['Maintenance','Repairs','Utilities','Insurance','Taxes','Management Fee','Marketing','Other'];
const BLANK = { unit_id: '', amount: '', category: CATS[0], date: new Date().toISOString().split('T')[0], description: '' };

export default function ExpensesScreen() {
  const [expenses, setExpenses]   = useState<any[]>([]);
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
      const [eR, uR] = await Promise.all([expensesApi.getAll(), unitsApi.getAll()]);
      setExpenses(eR?.data ?? []); setUnits(uR?.data ?? []);
    } catch { Alert.alert('Error', 'Failed to load expenses.'); }
    finally { setLoading(false); setRefresh(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const unitName = (id: number) => units.find((u: any) => u.id === id)?.name ?? `Unit #${id}`;

  const openCreate = () => { setEditing(null); setForm({ ...BLANK, unit_id: units[0]?.id ? String(units[0].id) : '' }); setFormError(''); setModal(true); };
  const openEdit   = (e: any) => {
    setEditing(e);
    setForm({ unit_id: String(e.unit_id), amount: String(e.amount), category: e.category, date: e.date, description: e.description ?? '' });
    setFormError(''); setModal(true);
  };

  const handleDelete = (id: number) => Alert.alert('Delete expense', 'Delete this expense record?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await expensesApi.delete(id); load(); }
      catch { Alert.alert('Error', 'Failed to delete.'); }
    }},
  ]);

  const handleSubmit = async () => {
    if (!form.unit_id || !form.amount) { setFormError('Unit and amount are required.'); return; }
    setSubmit(true); setFormError('');
    try {
      const payload = { ...form, unit_id: Number(form.unit_id), amount: Number(form.amount) };
      if (editing) await expensesApi.update(editing.id, payload);
      else await expensesApi.create(payload);
      setModal(false); load();
    } catch (e: any) { setFormError(getErrorMessage(e, 'Failed to save expense.')); }
    finally { setSubmit(false); }
  };

  const total = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);

  if (loading) return <Loader />;

  return (
    <SafeAreaView style={styles.safe} edges={['left','right']}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.totalLabel}>Total Expenses</Text>
          <Text style={styles.totalValue}>${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}><Text style={styles.addBtnText}>+ Record</Text></TouchableOpacity>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); load(); }} tintColor={colors.accent} />}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 32 }}
        ListEmptyComponent={<EmptyState message="No expense records. Tap + Record to add one." />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <Badge label={item.category} variant="neutral" />
                  <Text style={styles.date}>{item.date}</Text>
                </View>
                <Text style={styles.unitName}>{unitName(item.unit_id)}</Text>
                {item.description && <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>}
              </View>
              <Text style={styles.amount}>${Number(item.amount).toFixed(2)}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}><Text style={styles.actionEdit}>Edit</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.actionDanger]} onPress={() => handleDelete(item.id)}><Text style={styles.actionDeleteText}>Delete</Text></TouchableOpacity>
            </View>
          </Card>
        )}
      />

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Expense' : 'Record Expense'}</Text>
            <TouchableOpacity onPress={() => setModal(false)}><Text style={styles.modalClose}>Cancel</Text></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {formError && <AlertBox message={formError} />}

            <Text style={styles.selectLabel}>Unit</Text>
            <View style={styles.chipRow}>
              {units.map((u: any) => (
                <TouchableOpacity key={u.id} style={[styles.chip, form.unit_id === String(u.id) && styles.chipActive]} onPress={() => setForm({ ...form, unit_id: String(u.id) })}>
                  <Text style={[styles.chipText, form.unit_id === String(u.id) && styles.chipActiveText]}>{u.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.selectLabel}>Category</Text>
            <View style={styles.chipRow}>
              {CATS.map(c => (
                <TouchableOpacity key={c} style={[styles.chip, form.category === c && styles.chipActive]} onPress={() => setForm({ ...form, category: c })}>
                  <Text style={[styles.chipText, form.category === c && styles.chipActiveText]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input label="Amount ($)" placeholder="0.00" keyboardType="decimal-pad" value={form.amount} onChangeText={v => setForm({ ...form, amount: v })} />
            <DateField label="Date" value={form.date} onChange={v => setForm({ ...form, date: v })} />
            <Input label="Description (optional)" placeholder="Details…" multiline value={form.description} onChangeText={v => setForm({ ...form, description: v })} />
            <Button label={submitting ? 'Saving…' : editing ? 'Update Expense' : 'Record Expense'} loading={submitting} size="lg" onPress={handleSubmit} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  topBar:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.surface1, borderBottomWidth: 1, borderBottomColor: colors.border },
  totalLabel: { fontSize: font.xs, color: colors.text3, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalValue: { fontSize: font.xxl, fontFamily: fonts.extrabold, color: colors.red, marginTop: 2 },
  addBtn:  { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 7 },
  addBtnText: { color: '#fff', fontFamily: fonts.semibold, fontSize: font.sm },
  card:    { marginBottom: spacing.sm },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  unitName:{ fontSize: font.sm, color: colors.text2 },
  date:    { fontSize: font.xs, color: colors.text3 },
  desc:    { fontSize: font.sm, color: colors.text3, marginTop: 4 },
  amount:  { fontSize: font.lg, fontFamily: fonts.bold, color: colors.red, flexShrink: 0 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn:   { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderMd },
  actionEdit:  { color: colors.accentHover, fontFamily: fonts.semibold, fontSize: font.sm },
  actionDanger: { backgroundColor: colors.redDim, borderColor: 'transparent' },
  actionDeleteText: { color: colors.red, fontFamily: fonts.semibold, fontSize: font.sm },
  modalSafe:   { flex: 1, backgroundColor: colors.surface1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle:  { fontSize: font.lg, fontFamily: fonts.bold, color: colors.text },
  modalClose:  { color: colors.accentHover, fontSize: font.md, fontFamily: fonts.medium },
  modalBody:   { padding: spacing.lg },
  selectLabel: { fontSize: font.sm, color: colors.text2, fontFamily: fonts.medium, marginBottom: spacing.sm },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip:        { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderMd },
  chipActive:  { backgroundColor: colors.accentDim, borderColor: colors.accentBorder },
  chipText:    { fontSize: font.sm, color: colors.text2 },
  chipActiveText: { color: colors.accentHover, fontFamily: fonts.semibold },
});
