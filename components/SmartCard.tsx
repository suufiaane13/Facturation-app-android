import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette } from '@/constants/Colors';
import StatusBadge from './StatusBadge';
import { Swipeable } from 'react-native-gesture-handler';

interface SmartCardProps {
  docNumber: string;
  clientName: string;
  total: number;
  status: string;
  date: string;
  amountPaid?: number;
  onPress?: () => void;
  renderRightActions?: () => React.ReactNode;
  swipeableRef?: any;
  onSwipeableWillOpen?: () => void;
  compact?: boolean;
}

export default function SmartCard({
  docNumber, clientName, total, status, date, amountPaid, onPress, renderRightActions, swipeableRef, onSwipeableWillOpen, compact
}: SmartCardProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const hasPaymentProgress = amountPaid !== undefined && amountPaid > 0 && amountPaid < total;
  const paymentProgress = hasPaymentProgress ? amountPaid! / total : 0;

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} onSwipeableWillOpen={onSwipeableWillOpen} containerStyle={{ overflow: 'visible' }}>
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        {
          backgroundColor: isDark ? Palette.slate[800] : '#FFFFFF',
          borderColor: isDark ? Palette.slate[700] : Palette.slate[100],
          transform: [{ scale: pressed ? 0.98 : 1 }],
          shadowColor: isDark ? '#000' : Palette.slate[300],
        },
      ]}
    >
      <View style={[styles.header, compact && styles.headerCompact]}>
        <Text style={[styles.docNumber, compact && styles.docNumberCompact, { color: isDark ? Palette.slate[400] : Palette.slate[500] }]}>
          {docNumber}
        </Text>
        <StatusBadge status={status as any} />
      </View>

      <Text style={[styles.clientName, compact && styles.clientNameCompact, { color: isDark ? Palette.slate[50] : Palette.slate[900] }]}>
        {clientName}
      </Text>

      <View style={styles.footer}>
        <Text style={[styles.total, compact && styles.totalCompact, { color: Palette.danger }]}>
          {total.toFixed(2)} €
        </Text>
        <Text style={[styles.date, compact && styles.dateCompact, { color: isDark ? Palette.slate[500] : Palette.slate[400] }]}>
          {date}
        </Text>
      </View>

      {hasPaymentProgress && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBg, { backgroundColor: isDark ? Palette.slate[700] : Palette.slate[100] }]}>
            <View style={[styles.progressFill, { width: `${paymentProgress * 100}%`, backgroundColor: Palette.success }]} />
          </View>
          <Text style={[styles.progressText, { color: isDark ? Palette.slate[400] : Palette.slate[500] }]}>
            {amountPaid!.toFixed(2)} € / {total.toFixed(2)} €
          </Text>
        </View>
      )}
    </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  docNumber: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  total: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'right',
  },
  cardCompact: {
    padding: 10,
    marginBottom: 6,
    borderRadius: 10,
  },
  headerCompact: {
    marginBottom: 2,
  },
  clientNameCompact: {
    fontSize: 13,
    marginBottom: 4,
  },
  totalCompact: {
    fontSize: 14,
  },
  docNumberCompact: {
    fontSize: 10,
  },
  dateCompact: {
    fontSize: 10,
  },
});
