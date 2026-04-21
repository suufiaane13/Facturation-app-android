import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { DollarSign, AlertTriangle, FileCheck, Plus, FileText, Receipt } from 'lucide-react-native';
import { db } from '@/db/client';
import { quotes, invoices, clients } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette } from '@/constants/Colors';
import StatCard from '@/components/StatCard';
import SmartCard from '@/components/SmartCard';
import EmptyState from '@/components/EmptyState';
import SkeletonLoader from '@/components/SkeletonLoader';

export default function DashboardScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const [stats, setStats] = useState({ revenue: 0, unpaid: 0, toConvert: 0 });
  const [revenueData, setRevenueData] = useState<{label: string, value: number, year: number, month: number}[]>([]);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    setIsLoading(true);
    try {
      // Revenue: sum of paid invoices
      const paidInvoices = await db.select().from(invoices).where(eq(invoices.status, 'Payée'));
      const revenue = paidInvoices.reduce((sum, inv) => sum + (inv.total ?? 0), 0);

      // Unpaid: sum of balance_due for non-paid invoices
      const unpaidInvoices = await db.select().from(invoices).where(eq(invoices.status, 'En attente'));
      const unpaid = unpaidInvoices.reduce((sum, inv) => sum + (inv.balanceDue ?? 0), 0);

      const signedQuotes = await db.select().from(quotes).where(eq(quotes.status, 'Signé'));
      const toConvert = signedQuotes.length;

      setStats({ revenue, unpaid, toConvert });

      // Revenue Chart Data (last 6 months)
      const monthsList = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('fr-FR', { month: 'short' });
        monthsList.push({ label, value: 0, year: d.getFullYear(), month: d.getMonth() });
      }

      paidInvoices.forEach(inv => {
        if (inv.createdAt) {
          const d = new Date(inv.createdAt);
          const m = monthsList.find(x => x.year === d.getFullYear() && x.month === d.getMonth());
          if (m) {
            m.value += (inv.total ?? 0);
          }
        }
      });
      setRevenueData(monthsList);

      // Recent documents (last 5 quotes + invoices combined)
      const recentQuotes = await db.select({
        id: quotes.id,
        number: quotes.quoteNumber,
        clientId: quotes.clientId,
        total: quotes.total,
        status: quotes.status,
        createdAt: quotes.createdAt,
      }).from(quotes).orderBy(desc(quotes.createdAt)).limit(5);

      const recentInvoices = await db.select({
        id: invoices.id,
        number: invoices.invoiceNumber,
        clientId: invoices.clientId,
        total: invoices.total,
        status: invoices.status,
        createdAt: invoices.createdAt,
        amountPaid: invoices.amountPaid,
      }).from(invoices).orderBy(desc(invoices.createdAt)).limit(5);

      // Merge, sort by date, take 5
      const allClients = await db.select().from(clients);
      const clientMap = Object.fromEntries(allClients.map(c => [c.id, c.name]));

      const merged = [
        ...recentQuotes.map(q => ({ ...q, type: 'quote' as const, amountPaid: undefined })),
        ...recentInvoices.map(i => ({ ...i, type: 'invoice' as const })),
      ].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }).slice(0, 5).map(doc => ({
        ...doc,
        clientName: clientMap[doc.clientId] || 'Client inconnu',
        dateStr: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('fr-FR') : '',
      }));

      setRecentDocs(merged);
    } catch (e) {
      console.error('Dashboard load error:', e);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? Palette.slate[900] : Palette.slate[50] }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Stats */}
      <Text style={[styles.sectionTitle, { color: isDark ? Palette.slate[200] : Palette.slate[700] }]}>
        Statistiques
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll} contentContainerStyle={styles.statsContent}>
        {isLoading ? (
          <>
            <View style={[styles.statCardSkeleton, { backgroundColor: isDark ? Palette.slate[800] : '#FFF', borderColor: isDark ? Palette.slate[700] : Palette.slate[100] }]}>
              <View style={styles.statIconSkeleton}><SkeletonLoader width={40} height={40} borderRadius={20} /></View>
              <SkeletonLoader width={60} height={14} style={{ marginTop: 12, marginBottom: 8 }} />
              <SkeletonLoader width={80} height={24} />
            </View>
            <View style={[styles.statCardSkeleton, { backgroundColor: isDark ? Palette.slate[800] : '#FFF', borderColor: isDark ? Palette.slate[700] : Palette.slate[100] }]}>
              <View style={styles.statIconSkeleton}><SkeletonLoader width={40} height={40} borderRadius={20} /></View>
              <SkeletonLoader width={60} height={14} style={{ marginTop: 12, marginBottom: 8 }} />
              <SkeletonLoader width={80} height={24} />
            </View>
            <View style={[styles.statCardSkeleton, { backgroundColor: isDark ? Palette.slate[800] : '#FFF', borderColor: isDark ? Palette.slate[700] : Palette.slate[100] }]}>
              <View style={styles.statIconSkeleton}><SkeletonLoader width={40} height={40} borderRadius={20} /></View>
              <SkeletonLoader width={60} height={14} style={{ marginTop: 12, marginBottom: 8 }} />
              <SkeletonLoader width={80} height={24} />
            </View>
          </>
        ) : (
          <>
            <StatCard
              title="CA du mois"
              value={`${stats.revenue.toFixed(0)}€`}
              color={isDark ? Palette.slate[50] : Palette.primary}
              icon={<DollarSign size={20} color={isDark ? Palette.slate[50] : Palette.primary} />}
            />
            <StatCard
              title="Impayés"
              value={`${stats.unpaid.toFixed(0)}€`}
              color={Palette.danger}
              icon={<AlertTriangle size={20} color={Palette.danger} />}
            />
            <StatCard
              title="À convertir"
              value={String(stats.toConvert)}
              color={Palette.success}
              icon={<FileCheck size={20} color={Palette.success} />}
            />
          </>
        )}
      </ScrollView>

      {/* Revenue Chart */}
      <Text style={[styles.sectionTitle, { color: isDark ? Palette.slate[200] : Palette.slate[700] }]}>
        Chiffre d'affaires
      </Text>
      <View style={[styles.chartCard, { backgroundColor: isDark ? Palette.slate[800] : '#FFF', borderColor: isDark ? Palette.slate[700] : Palette.slate[100] }]}>
        {isLoading ? (
          <>
            <View style={{ marginBottom: 16 }}>
              <SkeletonLoader width={150} height={14} style={{ marginBottom: 6 }} />
              <SkeletonLoader width={100} height={24} />
            </View>
            <View style={styles.chartContainer}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={styles.chartCol}>
                  <SkeletonLoader width={28} height={110} borderRadius={8} />
                  <SkeletonLoader width={30} height={12} style={{ marginTop: 8 }} />
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 13, color: isDark ? Palette.slate[400] : Palette.slate[500], fontWeight: '500' }}>Total encaissé sur la période</Text>
              <Text style={{ fontSize: 24, fontWeight: '800', color: isDark ? Palette.slate[50] : Palette.slate[900] }}>
                {revenueData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString('fr-FR')} €
              </Text>
            </View>
            <View style={styles.chartContainer}>
              {revenueData.map((d, index) => {
                const maxVal = Math.max(...revenueData.map(r => r.value), 100);
                const heightPerc = Math.max((d.value / maxVal) * 100, 4); // Always show a tiny 4% bar even for 0
                return (
                  <View key={index} style={styles.chartCol}>
                    <Text style={[styles.chartVal, { color: isDark ? Palette.slate[400] : Palette.slate[600] }]} numberOfLines={1}>
                      {d.value > 0 ? (d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : Math.round(d.value)) : ''}
                    </Text>
                    <View style={[styles.chartBarBg, { backgroundColor: isDark ? Palette.slate[700] : Palette.slate[100] }]}>
                      <View style={[styles.chartBarFill, { height: `${heightPerc}%`, backgroundColor: d.value > 0 ? (isDark ? Palette.slate[50] : Palette.primary) : 'transparent' }]} />
                    </View>
                    <Text style={[styles.chartLabel, { color: isDark ? Palette.slate[400] : Palette.slate[500] }]}>{d.label}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>

      {/* Quick Actions */}
      <Text style={[styles.sectionTitle, { color: isDark ? Palette.slate[200] : Palette.slate[700] }]}>
        Actions rapides
      </Text>
      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            {
              backgroundColor: isDark ? Palette.slate[800] : '#FFFFFF',
              borderColor: isDark ? Palette.slate[700] : Palette.slate[100],
              shadowColor: isDark ? '#000' : Palette.slate[300],
              transform: [{ scale: pressed ? 0.97 : 1 }],
            }
          ]}
          onPress={() => router.push({ pathname: '/documents/new', params: { type: 'quote' } })}
        >
          <View style={[styles.actionIconBg, { backgroundColor: isDark ? Palette.slate[700] : Palette.primary + '15' }]}>
            <FileText size={24} color={isDark ? Palette.slate[50] : Palette.primary} />
          </View>
          <Text style={[styles.actionCardText, { color: isDark ? Palette.slate[50] : Palette.slate[900] }]}>Nouveau Devis</Text>
        </Pressable>
        
        <Pressable
          style={({ pressed }) => [
            styles.actionCard,
            {
              backgroundColor: isDark ? Palette.slate[800] : '#FFFFFF',
              borderColor: isDark ? Palette.slate[700] : Palette.slate[100],
              shadowColor: isDark ? '#000' : Palette.slate[300],
              transform: [{ scale: pressed ? 0.97 : 1 }],
            }
          ]}
          onPress={() => router.push({ pathname: '/documents/new', params: { type: 'invoice' } })}
        >
          <View style={[styles.actionIconBg, { backgroundColor: Palette.success + '15' }]}>
            <Receipt size={24} color={Palette.success} />
          </View>
          <Text style={[styles.actionCardText, { color: isDark ? Palette.slate[50] : Palette.slate[900] }]}>Nouvelle Facture</Text>
        </Pressable>
      </View>

      {/* Recent Documents */}
      <Text style={[styles.sectionTitle, { color: isDark ? Palette.slate[200] : Palette.slate[700] }]}>
        Documents récents
      </Text>
      {isLoading ? (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {[...Array(3)].map((_, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? Palette.slate[800] : '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: isDark ? Palette.slate[700] : Palette.slate[100] }}>
              <SkeletonLoader width={40} height={40} borderRadius={8} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <SkeletonLoader width={120} height={14} style={{ marginBottom: 6 }} />
                <SkeletonLoader width={80} height={12} />
              </View>
              <SkeletonLoader width={60} height={16} />
            </View>
          ))}
        </View>
      ) : recentDocs.length === 0 ? (
        <EmptyState
          icon={<FileText size={36} color={Palette.slate[400]} />}
          title="Aucun document"
          subtitle="Créez votre premier devis ou facture pour commencer."
          actionLabel="Créer un devis"
          onAction={() => router.push({ pathname: '/documents/new', params: { type: 'quote' } })}
        />
      ) : (
        recentDocs.map((doc) => (
          <SmartCard
            key={`${doc.type}-${doc.id}`}
            docNumber={doc.number}
            clientName={doc.clientName}
            total={doc.total ?? 0}
            status={doc.status ?? 'Brouillon'}
            date={doc.dateStr}
            amountPaid={doc.amountPaid ?? undefined}
            onPress={() => router.push(`/documents/${doc.id}`)}
            compact={true}
          />
        ))
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 20 },
  statsScroll: { marginBottom: 24 },
  statsContent: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginHorizontal: 20, marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 16, paddingHorizontal: 16, marginBottom: 28 },
  actionCard: { flex: 1, paddingVertical: 20, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 12, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  actionIconBg: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  actionCardText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  chartCard: { marginHorizontal: 16, marginBottom: 28, padding: 20, borderRadius: 24, borderWidth: 1, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 160 },
  chartCol: { flex: 1, alignItems: 'center', gap: 8 },
  chartVal: { fontSize: 11, fontWeight: '700', height: 16 },
  chartBarBg: { width: 28, height: 110, borderRadius: 8, justifyContent: 'flex-end', overflow: 'hidden' },
  chartBarFill: { width: '100%', borderRadius: 8 },
  chartLabel: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  statCardSkeleton: { width: 150, padding: 16, borderRadius: 20, borderWidth: 1, marginRight: 12, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  statIconSkeleton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});
