import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { Palette } from '@/constants/Colors';

interface StatCardProps {
  title: string;
  value: string;
  color: string;
  icon: React.ReactNode;
}

export default function StatCard({ title, value, color, icon }: StatCardProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  return (
    <View style={[styles.card, {
      backgroundColor: isDark ? Palette.slate[800] : '#FFFFFF',
      borderLeftColor: color,
      shadowColor: isDark ? '#000' : Palette.slate[300],
    }]}>
      <View style={[styles.iconContainer, { backgroundColor: color + '18' }]}>
        {icon}
      </View>
      <Text style={[styles.value, { color: isDark ? Palette.slate[50] : Palette.slate[900] }]}>
        {value}
      </Text>
      <Text style={[styles.title, { color: isDark ? Palette.slate[400] : Palette.slate[500] }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 150,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    marginRight: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
