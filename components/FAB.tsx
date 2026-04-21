import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface FABProps {
  icon: React.ReactNode;
  label?: string;
  onPress: () => void;
  color?: string;
}

export default function FAB({ icon, label, onPress, color = Palette.primary }: FABProps) {
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const isDefaultColor = color === Palette.primary;
  
  const bgColor = isDark && isDefaultColor ? Palette.slate[800] : color;
  const textColor = '#FFFFFF';

  const renderIcon = () => {
    return icon;
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: bgColor,
          transform: [{ scale: pressed ? 0.92 : 1 }],
          shadowColor: bgColor,
          borderWidth: isDark && isDefaultColor ? 1 : 0,
          borderColor: isDark && isDefaultColor ? Palette.slate[700] : 'transparent',
        },
        label ? styles.extended : styles.circular,
      ]}
    >
      {renderIcon()}
      {label && <Text style={[styles.label, { color: textColor }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
  circular: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  extended: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
