import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import LottieView from 'lottie-react-native';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  secondaryBtnText?: string;
  onSecondaryAction?: () => void;
}

export default function SuccessModal({ 
  visible, title, message, onClose, secondaryBtnText, onSecondaryAction 
}: SuccessModalProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: isDark ? Palette.slate[800] : '#FFF' }]}>
          <LottieView
            source={require('@/assets/animations/success.json')}
            autoPlay
            loop={false}
            style={styles.animation}
          />
          <Text style={[styles.title, { color: isDark ? Palette.slate[50] : Palette.slate[900] }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: isDark ? Palette.slate[400] : Palette.slate[600] }]}>
            {message}
          </Text>
          
          <View style={styles.btnContainer}>
            {secondaryBtnText && onSecondaryAction && (
              <Pressable
                onPress={onSecondaryAction}
                style={[styles.btn, styles.secondaryBtn, { borderColor: Palette.primary }]}
              >
                <Text style={[styles.btnText, { color: Palette.primary }]}>{secondaryBtnText}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onClose}
              style={[styles.btn, { backgroundColor: Palette.primary }]}
            >
              <Text style={styles.btnText}>{secondaryBtnText ? 'Plus tard' : 'Continuer'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '90%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  animation: {
    width: 150,
    height: 150,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  btnContainer: {
    width: '100%',
    gap: 12,
  },
  btn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryBtn: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
