import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

type StatusType =
  | 'Brouillon' | 'Envoyé' | 'Signé' | 'Refusé' | 'Facturé'
  | 'En attente' | 'Partielle' | 'Payée' | 'En retard';

const STATUS_COLORS: Record<StatusType, { bg: string; text: string }> = {
  'Brouillon':  { bg: Palette.slate[200], text: Palette.slate[700] },
  'Envoyé':     { bg: '#DBEAFE', text: '#1D4ED8' },
  'Signé':      { bg: '#D1FAE5', text: '#047857' },
  'Refusé':     { bg: '#FFE4E6', text: '#BE123C' },
  'Facturé':    { bg: '#E0E7FF', text: '#4338CA' },
  'En attente': { bg: '#FEF3C7', text: '#B45309' },
  'Partielle':  { bg: '#FED7AA', text: '#C2410C' },
  'Payée':      { bg: '#D1FAE5', text: '#047857' },
  'En retard':  { bg: '#FFE4E6', text: '#BE123C' },
};

const STATUS_COLORS_DARK: Record<StatusType, { bg: string; text: string }> = {
  'Brouillon':  { bg: 'rgba(225, 29, 72, 0.2)', text: '#E53935' },
  'Envoyé':     { bg: 'rgba(29, 78, 216, 0.2)', text: '#93C5FD' },
  'Signé':      { bg: 'rgba(4, 120, 87, 0.2)', text: '#6EE7B7' },
  'Refusé':     { bg: 'rgba(190, 18, 60, 0.2)', text: '#FDA4AF' },
  'Facturé':    { bg: 'rgba(67, 56, 202, 0.2)', text: '#A5B4FC' },
  'En attente': { bg: 'rgba(180, 83, 9, 0.2)', text: '#FCD34D' },
  'Partielle':  { bg: 'rgba(194, 65, 12, 0.2)', text: '#FDBA74' },
  'Payée':      { bg: 'rgba(4, 120, 87, 0.2)', text: '#6EE7B7' },
  'En retard':  { bg: 'rgba(190, 18, 60, 0.2)', text: '#FDA4AF' },
};

interface StatusBadgeProps {
  status: StatusType;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const isDark = (useColorScheme() ?? 'light') === 'dark';
  const colors = isDark 
    ? (STATUS_COLORS_DARK[status] || STATUS_COLORS_DARK['Brouillon'])
    : (STATUS_COLORS[status] || STATUS_COLORS['Brouillon']);

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
