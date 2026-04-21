import React from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette } from '@/constants/Colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChangeText, placeholder = 'Rechercher...' }: SearchBarProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  return (
    <View style={[styles.container, {
      backgroundColor: isDark ? Palette.slate[800] : '#FFFFFF',
      borderColor: isDark ? Palette.slate[700] : Palette.slate[200],
    }]}>
      <Search size={18} color={isDark ? Palette.slate[400] : Palette.slate[500]} />
      <TextInput
        style={[styles.input, { color: isDark ? Palette.slate[50] : Palette.slate[900] }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? Palette.slate[400] : Palette.slate[500]}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} style={{ padding: 4 }}>
          <X size={16} color={isDark ? Palette.slate[400] : Palette.slate[500]} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
});
