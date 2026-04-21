import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { ChevronLeft, Edit2, Phone, Mail, MapPin, FileText } from 'lucide-react-native';
import { db } from '@/db/client';
import { clients, quotes, invoices } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette } from '@/constants/Colors';
import SmartCard from '@/components/SmartCard';
import * as Linking from 'expo-linking';

export default function ClientProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const [client, setClient] = useState<any>(null);
  const [clientDocs, setClientDocs] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadClientData();
    }, [id])
  );

  async function loadClientData() {
    const clientId = parseInt(id ?? '0');
    if (!clientId) return;

    try {
      const c = await db.select().from(clients).where(eq(clients.id, clientId));
      if (c.length > 0) {
        setClient(c[0]);
      }

      // Load quotes
      const qs = await db.select().from(quotes)
        .where(eq(quotes.clientId, clientId))
        .orderBy(desc(quotes.createdAt));
      
      // Load invoices
      const is = await db.select().from(invoices)
        .where(eq(invoices.clientId, clientId))
        .orderBy(desc(invoices.createdAt));

      const combined = [
        ...qs.map(q => ({
          ...q,
          number: q.quoteNumber,
          dateStr: q.createdAt ? new Date(q.createdAt).toLocaleDateString('fr-FR') : '',
          type: 'quote'
        })),
        ...is.map(i => ({
          ...i,
          number: i.invoiceNumber,
          dateStr: i.createdAt ? new Date(i.createdAt).toLocaleDateString('fr-FR') : '',
          type: 'invoice'
        }))
      ];
      
      // Sort combined by date descending
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setClientDocs(combined);
    } catch (e) {
      console.error('Error loading client data:', e);
    }
  }

  if (!client) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? Palette.slate[900] : Palette.slate[50] }]} />
    );
  }

  const bgColor = isDark ? Palette.slate[900] : Palette.slate[50];
  const cardBg = isDark ? Palette.slate[800] : '#FFFFFF';
  const border = isDark ? Palette.slate[700] : Palette.slate[200];
  const textPrimary = isDark ? Palette.slate[50] : Palette.slate[900];
  const textSecondary = isDark ? Palette.slate[400] : Palette.slate[500];

  function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen 
        options={{
          title: 'Profil Client',
          headerRight: () => (
            <Pressable onPress={() => router.push({ pathname: '/clients/new', params: { editId: client.id.toString() } })} style={{ padding: 8 }}>
              <Edit2 size={20} color={Palette.primary} />
            </Pressable>
          ),
        }} 
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Info Card */}
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border, alignItems: 'center' }]}>
          <View style={[styles.avatar, { backgroundColor: Palette.primary + '20' }]}>
            <Text style={[styles.avatarText, { color: Palette.primary }]}>{getInitials(client.name)}</Text>
          </View>
          <Text style={[styles.clientName, { color: textPrimary }]}>{client.name}</Text>
          
          <View style={styles.actionsRow}>
            {client.phone && (
              <Pressable style={[styles.actionIcon, { backgroundColor: Palette.success + '20' }]} onPress={() => Linking.openURL(`tel:${client.phone}`)}>
                <Phone size={20} color={Palette.success} />
              </Pressable>
            )}
            {client.email && (
              <Pressable style={[styles.actionIcon, { backgroundColor: Palette.primary + '20' }]} onPress={() => Linking.openURL(`mailto:${client.email}`)}>
                <Mail size={20} color={Palette.primary} />
              </Pressable>
            )}
          </View>

          {client.address && (
            <View style={styles.infoRow}>
              <MapPin size={16} color={textSecondary} />
              <Text style={[styles.infoText, { color: textSecondary }]}>{client.address}</Text>
            </View>
          )}
          {client.phone && (
            <View style={styles.infoRow}>
              <Phone size={16} color={textSecondary} />
              <Text style={[styles.infoText, { color: textSecondary }]}>{client.phone}</Text>
            </View>
          )}
          {client.email && (
            <View style={styles.infoRow}>
              <Mail size={16} color={textSecondary} />
              <Text style={[styles.infoText, { color: textSecondary }]}>{client.email}</Text>
            </View>
          )}
        </View>

        {/* History */}
        <Text style={[styles.sectionTitle, { color: textSecondary }]}>HISTORIQUE DES DOCUMENTS</Text>
        
        {clientDocs.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: border }]}>
            <FileText size={32} color={Palette.slate[400]} />
            <Text style={[styles.emptyText, { color: textSecondary }]}>Aucun document pour ce client.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {clientDocs.map((doc) => (
              <SmartCard
                key={`${doc.type}-${doc.id}`}
                docNumber={doc.number}
                clientName={doc.type === 'quote' ? 'Devis' : 'Facture'} // Use client name spot to show type
                total={doc.total ?? 0}
                status={doc.status ?? 'Brouillon'}
                date={doc.dateStr}
                amountPaid={doc.type === 'invoice' ? (doc.amountPaid ?? undefined) : undefined}
                onPress={() => router.push(`/documents/${doc.id}`)}
              />
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 60 },
  card: { padding: 24, borderRadius: 20, borderWidth: 1, marginBottom: 24, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { fontSize: 24, fontWeight: '800' },
  clientName: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  actionsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch', marginBottom: 12, paddingHorizontal: 12 },
  infoText: { fontSize: 14, flex: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 12, marginLeft: 4 },
  emptyCard: { alignItems: 'center', justifyContent: 'center', padding: 32, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed' },
  emptyText: { marginTop: 12, fontSize: 14, fontWeight: '500' },
});
