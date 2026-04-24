import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { UserPlus, UserCheck } from 'lucide-react-native';
import { db } from '@/db/client';
import { clients } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette } from '@/constants/Colors';
import MessageModal from '@/components/MessageModal';
import SuccessModal from '@/components/SuccessModal';

export default function NewClientScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditing = !!editId;
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
  });

  const [msgConfig, setMsgConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'warning',
    onCloseAction: undefined as (() => void) | undefined,
  });

  const [successConfig, setSuccessConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const showMessage = (title: string, message: string, type: 'success' | 'error' | 'warning' = 'success', onCloseAction?: () => void) => {
    if (type === 'success') {
      setSuccessConfig({ visible: true, title, message });
    } else {
      setMsgConfig({ visible: true, title, message, type, onCloseAction });
    }
  };

  React.useEffect(() => {
    if (isEditing && editId) {
      loadClient(parseInt(editId));
    }
  }, [editId]);

  async function loadClient(id: number) {
    try {
      const c = await db.select().from(clients).where(eq(clients.id, id));
      if (c.length > 0) {
        setForm({
          name: c[0].name,
          address: c[0].address || '',
          email: c[0].email || '',
          phone: c[0].phone || '',
        });
      }
    } catch (e) {
      showMessage('Erreur', 'Impossible de charger le client.', 'error');
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      showMessage('Champ requis', 'Le nom du client est obligatoire.', 'error');
      return;
    }
    try {
      if (isEditing && editId) {
        await db.update(clients).set({
          name: form.name.trim(),
          address: form.address.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
        }).where(eq(clients.id, parseInt(editId)));
        showMessage('Client modifié', `${form.name} a été mis à jour avec succès.`, 'success', () => router.back());
      } else {
        await db.insert(clients).values({
          name: form.name.trim(),
          address: form.address.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
        });
        showMessage('Client créé', `${form.name} a été ajouté avec succès.`, 'success', () => router.back());
      }
    } catch (e) {
      console.error('Client save error:', e);
      showMessage('Erreur', isEditing ? 'Impossible de modifier le client.' : 'Impossible de créer le client.', 'error');
    }
  }

  const inputStyle = [styles.input, {
    color: isDark ? Palette.slate[50] : Palette.slate[900],
    backgroundColor: isDark ? Palette.slate[800] : '#FFFFFF',
    borderColor: isDark ? Palette.slate[700] : Palette.slate[200],
  }];

  const labelStyle = [styles.label, { color: isDark ? Palette.slate[300] : Palette.slate[600] }];

  return (
    <>
    <KeyboardAwareScrollView
      style={[styles.container, { backgroundColor: isDark ? Palette.slate[900] : Palette.slate[50] }]}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 40) }]}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      extraScrollHeight={40}
    >
      <View style={[styles.iconHeader, { backgroundColor: isDark ? Palette.slate[800] : Palette.primary + '15' }]}>
        {isEditing ? <UserCheck size={32} color={isDark ? '#FFF' : Palette.primary} /> : <UserPlus size={32} color={isDark ? '#FFF' : Palette.primary} />}
      </View>
      <Text style={[styles.heading, { color: isDark ? Palette.slate[50] : Palette.slate[900] }]}>
        {isEditing ? 'Modifier Client' : 'Nouveau Client'}
      </Text>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={labelStyle}>Nom *</Text>
          <TextInput style={inputStyle} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Nom du client" placeholderTextColor={Palette.slate[400]} />
        </View>
        <View style={styles.field}>
          <Text style={labelStyle}>Téléphone</Text>
          <TextInput style={inputStyle} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} placeholder="06 12 34 56 78" placeholderTextColor={Palette.slate[400]} keyboardType="phone-pad" />
        </View>
        <View style={styles.field}>
          <Text style={labelStyle}>Email</Text>
          <TextInput style={inputStyle} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} placeholder="client@email.com" placeholderTextColor={Palette.slate[400]} keyboardType="email-address" autoCapitalize="none" />
        </View>
        <View style={styles.field}>
          <Text style={labelStyle}>Adresse</Text>
          <TextInput style={[...inputStyle, styles.multiline]} value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} placeholder="Adresse complète..." placeholderTextColor={Palette.slate[400]} multiline />
        </View>
      </View>

      <Pressable onPress={handleSave} style={({ pressed }) => [styles.saveBtn, { backgroundColor: isDark ? Palette.slate[800] : Palette.primary, opacity: pressed ? 0.85 : 1 }]}>
        <Text style={styles.saveBtnText}>Ajouter le client</Text>
      </Pressable>
      <View style={{ height: 40 }} />
    </KeyboardAwareScrollView>
    <MessageModal
      visible={msgConfig.visible}
      title={msgConfig.title}
      message={msgConfig.message}
      type={msgConfig.type}
      onClose={() => {
        setMsgConfig((prev) => ({ ...prev, visible: false }));
        if (msgConfig.onCloseAction) msgConfig.onCloseAction();
      }}
    />
    <SuccessModal
      visible={successConfig.visible}
      title={successConfig.title}
      message={successConfig.message}
      onClose={() => {
        setSuccessConfig(prev => ({ ...prev, visible: false }));
        router.back();
      }}
    />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  iconHeader: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16, marginTop: 8 },
  heading: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 28 },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, marginTop: 28 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
