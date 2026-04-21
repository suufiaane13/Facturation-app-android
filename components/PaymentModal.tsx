import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TextInput, Dimensions } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette } from '@/constants/Colors';
import { CreditCard, Banknote, Landmark, Smartphone, MoreHorizontal, X } from 'lucide-react-native';

const METHODS = [
  { id: 'Virement', icon: Landmark },
  { id: 'CB', icon: CreditCard },
  { id: 'Espèces', icon: Banknote },
  { id: 'Chèque', icon: MoreHorizontal },
  { id: 'Autre', icon: Smartphone },
];

interface PaymentModalProps {
  visible: boolean;
  maxAmount: number;
  onClose: () => void;
  onSave: (amount: number, method: string, notes: string) => void;
}

export default function PaymentModal({ visible, maxAmount, onClose, onSave }: PaymentModalProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Virement');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (visible) {
      setAmount(maxAmount.toString());
      setMethod('Virement');
      setNotes('');
    }
  }, [visible, maxAmount]);

  const handleSave = () => {
    const val = parseFloat(amount.replace(',', '.'));
    if (isNaN(val) || val <= 0) return;
    onSave(val, method, notes.trim());
  };

  const bgColor = isDark ? Palette.slate[800] : '#FFFFFF';
  const textColor = isDark ? Palette.slate[50] : Palette.slate[900];
  const border = isDark ? Palette.slate[700] : Palette.slate[200];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent} scrollEnabled={false}>
          <View style={[styles.content, { backgroundColor: bgColor, borderColor: border }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: textColor }]}>Nouveau paiement</Text>
              <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDark ? Palette.slate[700] : Palette.slate[100] }]}>
                <X size={20} color={isDark ? Palette.slate[400] : Palette.slate[500]} />
              </Pressable>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={[styles.label, { color: isDark ? Palette.slate[300] : Palette.slate[600] }]}>Montant (€)</Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: border, backgroundColor: isDark ? Palette.slate[900] : '#F8FAFC' }]}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={isDark ? Palette.slate[500] : Palette.slate[400]}
                />
                <Text style={[styles.hint, { color: isDark ? Palette.slate[400] : Palette.slate[500] }]}>Reste à payer : {maxAmount.toFixed(2)} €</Text>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: isDark ? Palette.slate[300] : Palette.slate[600] }]}>Moyen de paiement</Text>
                <View style={styles.methodsRow}>
                  {METHODS.map((m) => {
                    const isSelected = method === m.id;
                    const Icon = m.icon;
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => setMethod(m.id)}
                        style={[
                          styles.methodBox,
                          { borderColor: isSelected ? Palette.primary : border, backgroundColor: isSelected ? (isDark ? Palette.primary + '20' : Palette.primary + '10') : 'transparent' }
                        ]}
                      >
                        <Icon size={20} color={isSelected ? Palette.primary : (isDark ? Palette.slate[400] : Palette.slate[500])} />
                        <Text style={[styles.methodText, { color: isSelected ? Palette.primary : (isDark ? Palette.slate[300] : Palette.slate[600]) }]}>{m.id}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: isDark ? Palette.slate[300] : Palette.slate[600] }]}>Notes (optionnel)</Text>
                <TextInput
                  style={[styles.input, { color: textColor, borderColor: border, backgroundColor: isDark ? Palette.slate[900] : '#F8FAFC' }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Référence virement, n° chèque..."
                  placeholderTextColor={isDark ? Palette.slate[500] : Palette.slate[400]}
                />
              </View>
            </View>

            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Valider le paiement</Text>
            </Pressable>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  content: { 
    width: width * 0.9, 
    maxWidth: 400, 
    borderRadius: 24, 
    borderWidth: 1, 
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '800' },
  closeBtn: { padding: 8, borderRadius: 12 },
  form: { gap: 16, marginBottom: 24 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15 },
  hint: { fontSize: 12, marginTop: 2 },
  methodsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  methodBox: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  methodText: { fontSize: 13, fontWeight: '600' },
  saveBtn: { backgroundColor: Palette.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
