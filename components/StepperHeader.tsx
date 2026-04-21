import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { User, Wrench, Package, CheckCircle } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette } from '@/constants/Colors';

const STEPS = [
  { icon: User, label: 'Client' },
  { icon: Wrench, label: 'Prestations' },
  { icon: Package, label: 'Matériels' },
  { icon: CheckCircle, label: 'Résumé' },
];

interface StepperHeaderProps {
  currentStep: number;
}

export default function StepperHeader({ currentStep }: StepperHeaderProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  return (
    <View style={[styles.container, {
      backgroundColor: isDark ? Palette.slate[900] : '#FFFFFF',
      borderBottomColor: isDark ? '#4A4A4A' : Palette.slate[100],
    }]}>
      <View style={styles.stepsRow}>
        {STEPS.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const Icon = step.icon;
          const circleColor = isActive ? Palette.danger : isCompleted ? Palette.success : isDark ? Palette.slate[700] : Palette.slate[200];
          const iconColor = isActive || isCompleted ? '#FFFFFF' : isDark ? Palette.slate[500] : Palette.slate[400];
          const labelColor = isActive ? Palette.danger : isCompleted ? Palette.success : isDark ? Palette.slate[500] : Palette.slate[400];

          return (
            <React.Fragment key={index}>
              {index > 0 && (
                <View style={[styles.connector, {
                  backgroundColor: isCompleted ? Palette.success : isDark ? Palette.slate[700] : Palette.slate[200],
                }]} />
              )}
              <View style={styles.stepItem}>
                <View style={[styles.circle, { backgroundColor: circleColor }]}>
                  <Icon size={16} color={iconColor} />
                </View>
                <Text style={[styles.label, { color: labelColor, fontWeight: isActive ? '700' : '500' }]}>
                  {step.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1 },
  stepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepItem: { alignItems: 'center', gap: 6 },
  circle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  connector: { flex: 1, height: 2, marginHorizontal: 4, borderRadius: 1, marginBottom: 20 },
  label: { fontSize: 10, letterSpacing: 0.3 },
});
