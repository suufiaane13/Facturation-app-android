import React, { useState } from 'react';
import { Image } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { LayoutDashboard, FileText, Users, Settings, Plus } from 'lucide-react-native';
import CreationTypeModal from '@/components/CreationTypeModal';
import Colors, { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme as 'light' | 'dark']?.tint || Colors.light.tint,
        tabBarInactiveTintColor: Colors[colorScheme as 'light' | 'dark']?.tabIconDefault || Colors.light.tabIconDefault,
        tabBarStyle: {
          backgroundColor: isDark ? Palette.slate[900] : '#FFFFFF',
          borderTopColor: isDark ? Palette.slate[800] : '#E2E8F0',
          borderTopWidth: 1,
          height: 60 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: isDark ? Palette.slate[900] : '#FFFFFF',
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? Palette.slate[800] : '#E2E8F0',
        },
        headerTintColor: isDark ? Palette.slate[50] : Palette.slate[900],
        headerTitleAlign: 'left',
        headerTitleContainerStyle: {
          paddingLeft: 0,
          marginLeft: 0,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerTitle: () => (
          <Image 
            source={require('../../assets/logo-padded.png')} 
            style={{ width: 140, height: 40, marginLeft: -35 }} 
            resizeMode="contain" 
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: 'Documents',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Créer',
          tabBarIcon: ({ color, size }) => <Plus size={size} color={color} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            setShowCreateModal(true);
          },
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
      </Tabs>

      <CreationTypeModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSelect={(type) => {
          router.push(`/documents/new?type=${type}`);
        }}
      />
    </>
  );
}
