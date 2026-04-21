import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity, Dimensions } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette } from '@/constants/Colors';
import { X, FileText, CreditCard } from 'lucide-react-native';

interface CreationTypeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: 'quote' | 'invoice') => void;
}

export default function CreationTypeModal({ visible, onClose, onSelect }: CreationTypeModalProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const bgColor = isDark ? Palette.slate[800] : '#FFFFFF';
  const textColor = isDark ? Palette.slate[50] : Palette.slate[900];
  const border = isDark ? Palette.slate[700] : Palette.slate[200];
  const mutedText = isDark ? Palette.slate[400] : Palette.slate[500];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.content, { backgroundColor: bgColor, borderColor: border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: textColor }]}>Créer un document</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDark ? Palette.slate[700] : Palette.slate[100] }]}>
              <X size={20} color={mutedText} />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[styles.optionBtn, { borderColor: border }]}
              onPress={() => {
                onSelect('quote');
                onClose();
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: isDark ? Palette.slate[700] : Palette.primary + '20' }]}>
                <FileText size={24} color={isDark ? Palette.slate[50] : Palette.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: textColor }]}>Devis</Text>
                <Text style={[styles.optionDesc, { color: mutedText }]}>Créer une proposition commerciale</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionBtn, { borderColor: border }]}
              onPress={() => {
                onSelect('invoice');
                onClose();
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: Palette.success + '20' }]}>
                <CreditCard size={24} color={Palette.success} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={[styles.optionTitle, { color: textColor }]}>Facture</Text>
                <Text style={[styles.optionDesc, { color: mutedText }]}>Demander un paiement</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    width: width,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 40, // extra padding for safe area
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 12,
  },
  optionsContainer: {
    gap: 16,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 13,
  },
});
