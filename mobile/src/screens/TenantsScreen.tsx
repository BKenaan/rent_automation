import React, { useCallback, useEffect, useState } from 'react';
import { fonts } from '../theme';
import {
  Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tenantsApi } from '../api';
import { AlertBox, Badge, Button, Card, EmptyState, Input, Loader } from '../components/ui';
import { colors, font, radius, spacing } from '../theme';

const BLANK = { full_name: '', email: '', phone: '', notes: '' };

export default function TenantsScreen() {
  const [tenants, setTenants]     = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefresh]  = useState(false);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState<any>(null);
  const [form, setForm]           = useState(BLANK);
  const [submitting, setSubmit]   = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    try { setTenants((await tenantsApi.getAll())?.data ?? []); }
    catch { Alert.alert('Error', 'Failed to load tenants.'); }
    finally { setLoading(false); setRefresh(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(BLANK); setFormError(''); setModal(true); };
  const openEdit   = (t: any) => {
    setEditing(t);
    setForm({ full_name: t.full_name, email: t.email, phone: t.phone, notes: t.notes ?? '' });
    setFormError(''); setModal(true);
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete tenant', `Delete ${name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await tenantsApi.delete(id); load(); }
        catch { Alert.alert('Error', 'Failed to delete tenant.'); }
      }},
    ]);
  };

  const handleSubmit = async () => {
    if (!form.full_name || !form.email || !form.phone) { setFormError('Name, email, and phone are required.'); return; }
    setSubmit(true); setFormError('');
    try {
      if (editing) await tenantsApi.update(editing.id, form);
      else await tenantsApi.create(form);
      setModal(false); load();
    } catch (e: any) {
      setFormError(e.response?.data?.detail ?? 'Failed to save tenant.');
    } finally { setSubmit(false); }
  };

  const filtered = tenants.filter(t =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <SafeAreaView style={styles.safe} edges={['left','right']}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search tenants…"
          placeholderTextColor={colors.text3}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); load(); }} tintColor={colors.accent} />}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 32 }}
        ListEmptyComponent={<EmptyState message={search ? `No results for "${search}"` : 'No tenants yet. Tap + Add to get started.'} />}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{item.full_name.charAt(0).toUpperCase()}</Text></View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.name}>{item.full_name}</Text>
                <Text style={styles.email}>{item.email}</Text>
                <Text style={styles.phone}>{item.phone}</Text>
              </View>
              <Badge label="Active" variant="green" />
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
                <Text style={styles.actionEdit}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.actionDanger]} onPress={() => handleDelete(item.id, item.full_name)}>
                <Text style={styles.actionDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />

      {/* Form Modal */}
      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModal(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Tenant' : 'Add Tenant'}</Text>
            <TouchableOpacity onPress={() => setModal(false)}><Text style={styles.modalClose}>Cancel</Text></TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {formError && <AlertBox message={formError} />}
            <Input label="Full Name" placeholder="Jane Smith" value={form.full_name} onChangeText={v => setForm({ ...form, full_name: v })} />
            <Input label="Email" placeholder="jane@example.com" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={v => setForm({ ...form, email: v })} />
            <Input label="Phone" placeholder="+1 555 0000" keyboardType="phone-pad" value={form.phone} onChangeText={v => setForm({ ...form, phone: v })} />
            <Input label="Notes (optional)" placeholder="Internal notes…" multiline value={form.notes} onChangeText={v => setForm({ ...form, notes: v })} />
            <Button label={submitting ? 'Saving…' : editing ? 'Update Tenant' : 'Create Tenant'} loading={submitting} size="lg" onPress={handleSubmit} />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: colors.bg },
  searchBar:    { flexDirection: 'row', gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.sm },
  searchInput:  { flex: 1, backgroundColor: colors.surface2, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.text, fontSize: font.sm, borderWidth: 1, borderColor: colors.borderMd },
  addBtn:       { backgroundColor: colors.accent, borderRadius: radius.md, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center' },
  addBtnText:   { color: '#fff', fontFamily: fonts.semibold, fontSize: font.sm },
  card:         { marginBottom: spacing.sm },
  cardHeader:   { flexDirection: 'row', alignItems: 'flex-start' },
  avatar:       { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.accentDim, borderWidth: 1, borderColor: colors.accentBorder, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:   { color: colors.accentHover, fontFamily: fonts.bold, fontSize: font.md },
  name:         { fontSize: font.md, fontFamily: fonts.semibold, color: colors.text },
  email:        { fontSize: font.sm, color: colors.text2, marginTop: 1 },
  phone:        { fontSize: font.sm, color: colors.text3 },
  actions:      { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionBtn:    { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.borderMd },
  actionEdit:   { color: colors.accentHover, fontFamily: fonts.semibold, fontSize: font.sm },
  actionDanger: { backgroundColor: colors.redDim, borderColor: 'transparent' },
  actionDeleteText: { color: colors.red, fontFamily: fonts.semibold, fontSize: font.sm },
  modalSafe:    { flex: 1, backgroundColor: colors.surface1 },
  modalHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle:   { fontSize: font.lg, fontFamily: fonts.bold, color: colors.text },
  modalClose:   { color: colors.accentHover, fontSize: font.md, fontFamily: fonts.medium },
  modalBody:    { padding: spacing.lg },
});
