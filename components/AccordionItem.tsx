import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette } from '@/constants/Colors';

interface AccordionItemProps {
  title: string;
  description: string | null;
  unitPrice: number;
  quantity: number;
  onUpdate: (data: { title: string; description: string | null; unitPrice: number; quantity: number }) => void;
  onDelete: () => void;
}

export default function AccordionItem({ title, description, unitPrice, quantity, onUpdate, onDelete }: AccordionItemProps) {
  const [expanded, setExpanded] = useState(false);
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const lineTotal = unitPrice * quantity;

  return (
    <View style={[styles.card, {
      backgroundColor: isDark ? Palette.slate[800] : '#FFFFFF',
      borderColor: isDark ? Palette.slate[700] : Palette.slate[200],
    }]}>
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: isDark ? Palette.slate[50] : Palette.slate[900] }]} numberOfLines={1}>
            {title || 'Nouvelle prestation'}
          </Text>
          <Text style={[styles.lineTotal, { color: Palette.primary }]}>
            {lineTotal.toFixed(2)} €
          </Text>
        </View>
        {expanded ? <ChevronUp size={18} color={Palette.slate[400]} /> : <ChevronDown size={18} color={Palette.slate[400]} />}
      </Pressable>

      {expanded && (
        <View style={styles.body}>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: isDark ? Palette.slate[400] : Palette.slate[500] }]}>Titre</Text>
            <TextInput
              style={[styles.input, { color: isDark ? Palette.slate[50] : Palette.slate[900], borderColor: isDark ? Palette.slate[600] : Palette.slate[200], backgroundColor: isDark ? Palette.slate[900] : Palette.slate[50] }]}
              value={title}
              onChangeText={(v) => onUpdate({ title: v, description, unitPrice, quantity })}
              placeholder="Ex: Installation chauffe-eau"
              placeholderTextColor={Palette.slate[400]}
            />
          </View>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: isDark ? Palette.slate[400] : Palette.slate[500] }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.multiline, { color: isDark ? Palette.slate[50] : Palette.slate[900], borderColor: isDark ? Palette.slate[600] : Palette.slate[200], backgroundColor: isDark ? Palette.slate[900] : Palette.slate[50] }]}
              value={description ?? ''}
              onChangeText={(v) => onUpdate({ title, description: v, unitPrice, quantity })}
              placeholder="Description détaillée..."
              placeholderTextColor={Palette.slate[400]}
              multiline
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: isDark ? Palette.slate[400] : Palette.slate[500] }]}>Prix unitaire (€)</Text>
              <TextInput
                style={[styles.input, { color: isDark ? Palette.slate[50] : Palette.slate[900], borderColor: isDark ? Palette.slate[600] : Palette.slate[200], backgroundColor: isDark ? Palette.slate[900] : Palette.slate[50] }]}
                value={String(unitPrice)}
                onChangeText={(v) => onUpdate({ title, description, unitPrice: parseFloat(v) || 0, quantity })}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={[styles.fieldLabel, { color: isDark ? Palette.slate[400] : Palette.slate[500] }]}>Quantité</Text>
              <TextInput
                style={[styles.input, { color: isDark ? Palette.slate[50] : Palette.slate[900], borderColor: isDark ? Palette.slate[600] : Palette.slate[200], backgroundColor: isDark ? Palette.slate[900] : Palette.slate[50] }]}
                value={String(quantity)}
                onChangeText={(v) => onUpdate({ title, description, unitPrice, quantity: parseFloat(v) || 0 })}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <Pressable onPress={onDelete} style={styles.deleteBtn}>
            <Trash2 size={16} color={Palette.danger} />
            <Text style={styles.deleteText}>Supprimer</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, marginBottom: 8, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  headerLeft: { flex: 1, marginRight: 8 },
  title: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  lineTotal: { fontSize: 13, fontWeight: '700' },
  body: { padding: 14, paddingTop: 0, gap: 12 },
  field: { gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  multiline: { minHeight: 60, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', paddingVertical: 6 },
  deleteText: { fontSize: 13, fontWeight: '600', color: Palette.danger },
});
