import React, { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { colors, font, fonts, radius, spacing } from '../theme';

function parseDate(value?: string): Date {
  if (value) {
    const d = new Date(`${value}T00:00:00`);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function pretty(value?: string): string {
  if (!value) return '';
  const d = parseDate(value);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

interface Props {
  label?: string;
  value: string;                    // 'YYYY-MM-DD'
  onChange: (v: string) => void;    // returns 'YYYY-MM-DD'
  placeholder?: string;
  minimumDate?: Date;
}

export const DateField: React.FC<Props> = ({ label, value, onChange, placeholder = 'Select date', minimumDate }) => {
  const [show, setShow] = useState(false);
  const [temp, setTemp] = useState<Date>(parseDate(value));

  const openPicker = () => { setTemp(parseDate(value)); setShow(true); };

  // Android: native dialog returns once; iOS: spinner inside a small modal with Done
  const onAndroidChange = (event: any, selected?: Date) => {
    setShow(false);
    if (event?.type === 'set' && selected) onChange(formatDate(selected));
  };

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity style={styles.field} onPress={openPicker} activeOpacity={0.7}>
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? pretty(value) : placeholder}
        </Text>
        <Calendar size={16} color={colors.text3} />
      </TouchableOpacity>

      {/* Android */}
      {show && Platform.OS === 'android' && (
        <DateTimePicker
          value={parseDate(value)}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          onChange={onAndroidChange}
        />
      )}

      {/* iOS — spinner in a bottom sheet with Done */}
      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="fade" onRequestClose={() => setShow(false)}>
          <TouchableOpacity style={styles.iosBackdrop} activeOpacity={1} onPress={() => setShow(false)}>
            <View style={styles.iosSheet}>
              <View style={styles.iosBar}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={styles.iosCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { onChange(formatDate(temp)); setShow(false); }}>
                  <Text style={styles.iosDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={temp}
                mode="date"
                display="spinner"
                themeVariant="dark"
                minimumDate={minimumDate}
                onChange={(_, selected) => selected && setTemp(selected)}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: font.sm, color: colors.text2, marginBottom: 6, fontFamily: fonts.medium },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderMd,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  value:       { fontSize: font.md, color: colors.text, fontFamily: fonts.regular },
  placeholder: { color: colors.text3 },
  iosBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  iosSheet:    { backgroundColor: colors.surface1, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 24 },
  iosBar:      { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  iosCancel:   { color: colors.text2, fontSize: font.md, fontFamily: fonts.medium },
  iosDone:     { color: colors.accentHover, fontSize: font.md, fontFamily: fonts.semibold },
});

export default DateField;
