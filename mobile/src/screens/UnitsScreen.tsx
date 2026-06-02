import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getErrorMessage } from '../utils/errors';
import { fonts } from '../theme';
import { Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { unitsApi } from '../api';
import { AlertBox, Badge, Button, Card, EmptyState, Input, Loader } from '../components/ui';
import { colors, font, radius, spacing } from '../theme';

const BLANK = { name: '', unit_code: '', address: '', type: 'apartment', purchase_price: '', target_yield: '', notes: '' };

export default function UnitsScreen() {
  const [units, setUnits]         = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefresh]  = useState(false);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState<any>(null);
  const [form, setForm]           = useState(BLANK);
  const [submitting, setSubmit]   = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    try { setUnits((await unitsApi.getAll())?.data ?? []); }
    catch { Alert.alert('Error', 'Failed to load units.'); }
    finally { setLoading(false); setRefresh(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openCreate = () => { setEditing(null); setForm(BLANK); setFormError(''); setModal(true); };
  const openEdit   = (u: any) => {
    setEditing(u);
    setForm({ name: u.name, unit_code: u.unit_code, address: u.address, type: u.type,
      purchase_price: String(u.purchase_price ?? ''), target_yield: String(u.target_yield ?? ''), notes: u.notes ?? '' });
    setFormError(''); setModal(true);
  };

  const handleDelete = (id: number, name: string) => Alert.alert('Delete unit', `Delete ${name}? This will also remove all leases and payments.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await unitsApi.delete(id); load(); }
      catch { Alert.alert('Error', 'Failed to delete unit.'); }
    }},
  ]);

  const handleSubmit = async () => {
    if (!form.name || !form.unit_code || !form.address) { setFormError('Name, code, and address are required.'); return; }
    setSubmit(true); setFormError('');
    try {
      const payload = { ...form, purchase_price: form.purchase_price ? Number(form.purchase_price) : null,
        target_yield: form.target_yield ? Number(form.target_yield) : null };
      if (editing) await unitsApi.update(editing.id, payload);
      else await unitsApi.create(payload);
      setModal(false); load();
    } catch (e: any) { setFormError(getErrorMessage(e, 'Failed to save unit. Check the unit code is unique.')); }
    finally { setSubmit(false); }
  };

  if (loading) return <Loader />;

  return (
    <SafeAreaView style={styles.safe} edges={['left','right']}>
      <View style={styles.topBar}>
        <Text style={styles.count}>{units.length} properties</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}><Text style={styles.addBtnText}>+ Add</Text></TouchableOpacity>
      </View>

      <FlatList
        data={units}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); load(); }} tintColor={colors.accent} />}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 32 }}
        ListEmptyComponent={<EmptyState message="No units yet. Tap + Add to add your first property." />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.unitName}>{item.name}</Text>
                <Text style={styles.unitAddress} numberOfLines={1}>{item.address}</Text>
              </View>
              <Badge label={item.type} variant="neutral" />
            </View>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Code</Text>
                <Text style={styles.statValue}>{item.unit_code}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Investment</Text>
                <Text style={styles.statValue}>{item.purchase_price ? `$${Number(item.purchase_price).toLocaleString()}` : '—'}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Target Yield</Text>
                <Text style={[styles.statValue, item.target_yield && { color: colors.green }]}>{item.target_yield ? `${item.target_yield}%` : '—'}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}><Text style={styles.actionEdit}>Edit</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.actionDanger]} onPress={() => handleDelete(item.id, item.name)}><Text style={styles.actionDeleteText}>Delete</Text></TouchableOpacity>
            </View>
          </Card>
        )}
      />

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Unit' : 'Add Unit'}</Text>
            <TouchableOpacity onPress={() => setModal(false)}><Text style={styles.modalClose}>Cancel</Text></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {formError && <AlertBox message={formError} />}
            <Input label="Unit Name" placeholder="Apartment 101" value={form.name} onChangeText={v => setForm({ ...form, name: v })} />
            <Input label="Unit Code (unique)" placeholder="A101" autoCapitalize="characters" value={form.unit_code} onChangeText={v => setForm({ ...form, unit_code: v })} />
            <Input label="Address" placeholder="123 Main St, City" value={form.address} onChangeText={v => setForm({ ...form, address: v })} />
            <Input label="Purchase Price ($)" placeholder="0.00" keyboardType="decimal-pad" value={form.purchase_price} onChangeText={v => setForm({ ...form, purchase_price: v })} />
            <Input label="Target Yield (%)" placeholder="5.0" keyboardType="decimal-pad" value={form.target_yield} onChangeText={v => setForm({ ...form, target_yield: v })} />
            <Input label="Notes (optional)" placeholder="Additional notes…" multiline value={form.notes} onChangeText={v => setForm({ ...form, notes: v })} />
            <Button label={submitting ? 'Saving…' : editing ? 'Update Unit' : 'Create Unit'} loading={submitting} size="lg" onPress={handleSubmit} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  topBar:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingBottom: spacing.sm },
  count:   { fontSize: font.sm, color: colors.text3, fontFamily: fonts.medium },
  addBtn:  { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 7 },
  addBtnText: { color: '#fff', fontFamily: fonts.semibold, fontSize: font.sm },
  card:    { marginBottom: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  unitName:    { fontSize: font.md, fontFamily: fonts.bold, color: colors.text },
  unitAddress: { fontSize: font.sm, color: colors.text3, marginTop: 2 },
  stats:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  stat:    { alignItems: 'center' },
  statLabel: { fontSize: 10, color: colors.text3, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: font.sm, fontFamily: fonts.semibold, color: colors.text, marginTop: 2 },
  actions:  { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderMd },
  actionEdit: { color: colors.accentHover, fontFamily: fonts.semibold, fontSize: font.sm },
  actionDanger: { backgroundColor: colors.redDim, borderColor: 'transparent' },
  actionDeleteText: { color: colors.red, fontFamily: fonts.semibold, fontSize: font.sm },
  modalSafe: { flex: 1, backgroundColor: colors.surface1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: font.lg, fontFamily: fonts.bold, color: colors.text },
  modalClose: { color: colors.accentHover, fontSize: font.md, fontFamily: fonts.medium },
  modalBody:  { padding: spacing.lg },
});
