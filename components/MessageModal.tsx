import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette } from '@/constants/Colors';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react-native';

interface MessageModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning';
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function MessageModal({ visible, title, message, type = 'success', onClose, onConfirm, confirmText = 'Confirmer', cancelText = 'Annuler' }: MessageModalProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const bgColor = isDark ? Palette.slate[800] : '#FFFFFF';
  const textColor = isDark ? Palette.slate[50] : Palette.slate[900];
  const border = isDark ? Palette.slate[700] : Palette.slate[200];
  const mutedTextColor = isDark ? Palette.slate[400] : Palette.slate[500];

  const Icon = type === 'success' ? CheckCircle2 : type === 'warning' ? AlertCircle : XCircle;
  const iconColor = type === 'success' ? Palette.success : type === 'warning' ? Palette.warning : Palette.danger;

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
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
            <Icon size={40} color={iconColor} />
          </View>
          
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          <Text style={[styles.message, { color: mutedTextColor }]}>{message}</Text>
          
          {onConfirm ? (
            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.button, styles.cancelButton, { backgroundColor: isDark ? Palette.slate[700] : Palette.slate[100] }]}
                onPress={onClose}
              >
                <Text style={[styles.buttonText, { color: textColor }]}>{cancelText}</Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.confirmButton, { backgroundColor: iconColor }]}
                onPress={onConfirm}
              >
                <Text style={styles.buttonText}>{confirmText}</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={[styles.button, { backgroundColor: iconColor }]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>OK</Text>
            </Pressable>
          )}
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
    width: width * 0.85,
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: 1,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
