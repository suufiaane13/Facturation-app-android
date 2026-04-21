import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette } from '@/constants/Colors';
import { Check, X } from 'lucide-react-native';

interface StatusModalProps {
  visible: boolean;
  onClose: () => void;
  options: string[];
  currentStatus: string;
  onSelect: (status: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Brouillon': return Palette.slate[500];
    case 'Envoyé': return Palette.primary;
    case 'Signé': return Palette.success;
    case 'Refusé': return Palette.danger;
    case 'En attente': return Palette.warning;
    case 'Partielle': return Palette.primary;
    case 'Payée': return Palette.success;
    case 'En retard': return Palette.danger;
    case 'Facturé': return Palette.primary;
    default: return Palette.slate[500];
  }
};

export default function StatusModal({ visible, onClose, options, currentStatus, onSelect }: StatusModalProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const bgColor = isDark ? Palette.slate[800] : '#FFFFFF';
  const textColor = isDark ? Palette.slate[50] : Palette.slate[900];
  const border = isDark ? Palette.slate[700] : Palette.slate[200];

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
            <Text style={[styles.title, { color: textColor }]}>Changer le statut</Text>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDark ? Palette.slate[700] : Palette.slate[100] }]}>
              <X size={20} color={isDark ? Palette.slate[400] : Palette.slate[500]} />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsContainer}>
            {options.map((status, index) => {
              const isSelected = status === currentStatus;
              const color = getStatusColor(status);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionBtn,
                    { borderColor: border },
                    isSelected && { backgroundColor: isDark ? Palette.slate[700] : Palette.slate[50], borderColor: color }
                  ]}
                  onPress={() => {
                    onSelect(status);
                    onClose();
                  }}
                >
                  <View style={styles.optionContent}>
                    <View style={[styles.statusDot, { backgroundColor: color }]} />
                    <Text style={[
                      styles.optionText,
                      { color: textColor },
                      isSelected && { fontWeight: '700' }
                    ]}>
                      {status}
                    </Text>
                  </View>
                  {isSelected && <Check size={20} color={color} />}
                </TouchableOpacity>
              );
            })}
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    gap: 12,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionText: {
    fontSize: 16,
  },
});
