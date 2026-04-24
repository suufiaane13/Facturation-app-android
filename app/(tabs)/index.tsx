import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { DollarSign, AlertTriangle, FileCheck, Plus, FileText, TrendingUp, Calendar } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import { db } from '@/db/client';
import { quotes, invoices, clients } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette } from '@/constants/Colors';
import StatCard from '@/components/StatCard';
import SmartCard from '@/components/SmartCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import CreationTypeModal from '@/components/CreationTypeModal';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const [stats, setStats] = useState({ revenue: 0, unpaid: 0, toConvert: 0 });
  const [revenueData, setRevenueData] = useState<{ labels: string[], datasets: { data: number[] }[] }>({
    labels: ['...', '...', '...', '...', '...', '...'],
    datasets: [{ data: [0, 0, 0, 0, 0, 0] }]
  });
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
      const monthsList: { label: string; value: number; year: number; month: number }[] = [];
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

      setRevenueData({
        labels: monthsList.map(m => m.label),
        datasets: [{ data: monthsList.map(m => m.value) }]
      });

      // Recent documents
      const allClients = await db.select().from(clients);
      const clientMap = Object.fromEntries(allClients.map(c => [c.id, c.name]));

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

      const merged = [
        ...recentQuotes.map(q => ({ ...q, type: 'quote' as const })),
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

  const chartConfig = {
    backgroundColor: isDark ? Palette.slate[900] : '#FFFFFF',
    backgroundGradientFrom: isDark ? Palette.slate[800] : '#FFFFFF',
    backgroundGradientTo: isDark ? Palette.slate[800] : '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => isDark ? `rgba(248, 250, 252, ${opacity})` : `rgba(47, 122, 169, ${opacity})`,
    labelColor: (opacity = 1) => isDark ? `rgba(148, 163, 184, ${opacity})` : `rgba(100, 116, 139, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '6', strokeWidth: '2', stroke: Palette.primary },
    propsForBackgroundLines: { strokeDasharray: '', stroke: isDark ? Palette.slate[700] : Palette.slate[100] }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? Palette.slate[900] : Palette.slate[50] }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Summary */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: isDark ? Palette.slate[400] : Palette.slate[500] }]}>Bonjour,</Text>
          <Text style={[styles.brand, { color: isDark ? Palette.slate[50] : Palette.slate[900] }]}>AD Services</Text>
        </View>
        <Pressable
          onPress={() => setShowCreateModal(true)}
          style={[styles.addBtn, { backgroundColor: Palette.primary }]}
        >
          <Plus size={20} color="#FFF" />
          <Text style={styles.addBtnText}>Nouveau</Text>
        </Pressable>
      </View>

      {/* Stats Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll} contentContainerStyle={styles.statsContent}>
        <StatCard
          title="CA Global"
          value={`${stats.revenue.toFixed(0)}€`}
          color={Palette.primary}
          icon={<DollarSign size={20} color="#FFF" />}
        />
        <StatCard
          title="Impayés"
          value={`${stats.unpaid.toFixed(0)}€`}
          color={Palette.danger}
          icon={<AlertTriangle size={20} color="#FFF" />}
        />
        <StatCard
          title="Devis Signés"
          value={String(stats.toConvert)}
          color={Palette.success}
          icon={<FileCheck size={20} color="#FFF" />}
        />
      </ScrollView>

      {/* Chart Section */}
      <View style={styles.sectionHeader}>
        <TrendingUp size={18} color={isDark ? Palette.slate[300] : Palette.slate[600]} />
        <Text style={[styles.sectionTitle, { color: isDark ? Palette.slate[200] : Palette.slate[700] }]}>Chiffre d'affaires</Text>
      </View>
      <View style={[styles.chartContainer, { backgroundColor: isDark ? Palette.slate[800] : '#FFF', borderColor: isDark ? Palette.slate[700] : Palette.slate[100] }]}>
        {isLoading ? (
          <SkeletonLoader width={screenWidth - 80} height={180} borderRadius={16} />
        ) : (
          <LineChart
            data={revenueData}
            width={screenWidth - 56}
            height={180}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
          />
        )}
      </View>

      {/* Recent Activity */}
      <View style={styles.sectionHeader}>
        <Calendar size={18} color={isDark ? Palette.slate[300] : Palette.slate[600]} />
        <Text style={[styles.sectionTitle, { color: isDark ? Palette.slate[200] : Palette.slate[700] }]}>Activité récente</Text>
      </View>
      <View style={styles.recentList}>
        {isLoading ? (
          [...Array(3)].map((_, i) => <SkeletonLoader key={i} width="100%" height={70} borderRadius={12} style={{ marginBottom: 12 }} />)
        ) : recentDocs.length > 0 ? (
          recentDocs.map((doc) => (
            <SmartCard
              key={`${doc.type}-${doc.id}`}
              docNumber={doc.number}
              clientName={doc.clientName}
              total={doc.total ?? 0}
              status={doc.status ?? 'Brouillon'}
              date={doc.dateStr}
              amountPaid={doc.amountPaid}
              onPress={() => router.push(`/documents/${doc.id}`)}
              compact={true}
            />
          ))
        ) : (
          <View style={[styles.emptyBox, { backgroundColor: isDark ? Palette.slate[800] : '#FFF' }]}>
            <FileText size={32} color={Palette.slate[400]} />
            <Text style={[styles.emptyText, { color: Palette.slate[400] }]}>Aucun document récent</Text>
          </View>
        )}
      </View>

      <CreationTypeModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSelect={(type) => {
          setShowCreateModal(false);
          router.push(`/documents/new?type=${type}`);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  greeting: { fontSize: 14, fontWeight: '500' },
  brand: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  statsScroll: { marginHorizontal: -20, marginBottom: 10 },
  statsContent: { paddingHorizontal: 20, paddingVertical: 4 },
  chartContainer: {
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  recentList: { gap: 4 },
  emptyBox: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    borderStyle: 'dashed',
  },
  emptyText: { fontSize: 14, fontWeight: '500' },
});
