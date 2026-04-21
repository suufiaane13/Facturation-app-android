import React, { useCallback, useState, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, ScrollView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, FileText, Search, X, Trash2, Edit2, Eye } from 'lucide-react-native';
import { db } from '@/db/client';
import { quotes, invoices, clients, lineItems } from '@/db/schema';
import { desc, eq, like, or, and } from 'drizzle-orm';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette } from '@/constants/Colors';
import SmartCard from '@/components/SmartCard';
import EmptyState from '@/components/EmptyState';
import MessageModal from '@/components/MessageModal';
import FAB from '@/components/FAB';
import SkeletonLoader from '@/components/SkeletonLoader';

type TabType = 'devis' | 'factures';

export default function DocumentsScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const [tab, setTab] = useState<TabType>('devis');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const PAGE_SIZE = 15;
  const rowRefs = useRef(new Map<string, any>());
  const prevOpenedRow = useRef<any>(null);
  const [msgConfig, setMsgConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'warning',
    onCloseAction: undefined as (() => void) | undefined,
    onConfirm: undefined as (() => void) | undefined,
  });

  const showMessage = (title: string, message: string, type: 'success' | 'error' | 'warning' = 'success', onCloseAction?: () => void, onConfirm?: () => void) => {
    setMsgConfig({ visible: true, title, message, type, onCloseAction, onConfirm });
  };

  useFocusEffect(
    useCallback(() => {
      loadDocuments(true, searchQuery);
      return () => {
        if (prevOpenedRow.current) {
          prevOpenedRow.current.close();
          prevOpenedRow.current = null;
        }
      };
    }, [tab])
  );

  const QUOTE_STATUSES = ['Brouillon', 'Envoyé', 'Accepté', 'Refusé', 'Expiré'];
  const INVOICE_STATUSES = ['Brouillon', 'Envoyé', 'Payé', 'Retard', 'Annulée'];

  async function loadDocuments(reset = false, query = searchQuery, currentTab = tab, currentStatusFilter = statusFilter) {
    if (isLoadingMore) return;
    const currentPage = reset ? 0 : page;
    if (!reset && !hasMore) return;

    if (reset) setIsLoading(true);
    setIsLoadingMore(true);
    try {
      const table = currentTab === 'devis' ? quotes : invoices;
      const numberCol = currentTab === 'devis' ? quotes.quoteNumber : invoices.invoiceNumber;
      
      const conditions = [];
      if (query) {
        conditions.push(
          or(
            like(numberCol, `%${query}%`),
            like(clients.name, `%${query}%`)
          ) as any
        );
      }
      if (currentStatusFilter) {
        conditions.push(eq(table.status, currentStatusFilter));
      }

      const fetched = await db.select({
        id: table.id,
        number: numberCol,
        status: table.status,
        total: table.total,
        createdAt: table.createdAt,
        clientId: table.clientId,
        clientName: clients.name
      })
      .from(table)
      .leftJoin(clients, eq(table.clientId, clients.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(table.createdAt))
      .limit(PAGE_SIZE)
      .offset(currentPage * PAGE_SIZE);

      const formatted = fetched.map(doc => ({
        ...doc,
        type: currentTab === 'devis' ? 'quote' : 'invoice',
        dateStr: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('fr-FR') : ''
      }));

      if (reset) {
        setDocuments(formatted);
      } else {
        setDocuments(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newItems = formatted.filter(f => !existingIds.has(f.id));
          return [...prev, ...newItems];
        });
      }
      
      setHasMore(fetched.length === PAGE_SIZE);
      setPage(currentPage + 1);
    } catch (e) {
      console.error('Documents load error:', e);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    loadDocuments(true, text, tab, statusFilter);
  };

  async function handleDelete(item: any) {
    showMessage('Confirmer', 'Voulez-vous vraiment supprimer ce document ?', 'warning', undefined, async () => {
      try {
        await db.delete(lineItems).where(eq(lineItems.docId, item.id));
        if (item.type === 'quote') {
          await db.delete(quotes).where(eq(quotes.id, item.id));
        } else {
          await db.delete(invoices).where(eq(invoices.id, item.id));
        }
        setMsgConfig(prev => ({ ...prev, visible: false }));
        loadDocuments(true, searchQuery);
      } catch (e) {
        showMessage('Erreur', 'Impossible de supprimer le document.', 'error');
      }
    });
  }

  const renderRightActions = (item: any) => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, paddingRight: 16 }}>
        <Pressable 
          style={[styles.swipeBtn, { backgroundColor: Palette.primary }]}
          onPress={() => router.push(`/documents/${item.id}`)}
        >
          <Eye size={20} color="#FFF" />
        </Pressable>
        {item.status === 'Brouillon' && (
          <Pressable 
            style={[styles.swipeBtn, { backgroundColor: isDark ? Palette.slate[600] : Palette.slate[400] }]}
            onPress={() => router.push({ pathname: '/documents/new', params: { type: item.type, editId: item.id.toString() } })}
          >
            <Edit2 size={20} color="#FFF" />
          </Pressable>
        )}
        <Pressable 
          style={[styles.swipeBtn, { backgroundColor: Palette.danger }]}
          onPress={() => handleDelete(item)}
        >
          <Trash2 size={20} color="#FFF" />
        </Pressable>
      </View>
    );
  };

  const handleSwipeableOpen = (id: string) => {
    const currentRow = rowRefs.current.get(id);
    if (prevOpenedRow.current && prevOpenedRow.current !== currentRow) {
      prevOpenedRow.current.close();
    }
    prevOpenedRow.current = currentRow;
  };


  return (
    <View style={[styles.container, { backgroundColor: isDark ? Palette.slate[900] : Palette.slate[50] }]}>
      {/* Tab Toggle */}
      <View style={[styles.tabBar, { backgroundColor: isDark ? Palette.slate[800] : Palette.slate[100] }]}>
        <Pressable
          onPress={() => {
            if (tab === 'devis') return;
            setTab('devis');
            setSearchQuery('');
            setStatusFilter(null);
            setDocuments([]);
            loadDocuments(true, '', 'devis', null);
          }}
          style={[styles.tabItem, tab === 'devis' && styles.tabActive, tab === 'devis' && { backgroundColor: isDark ? Palette.slate[700] : '#FFFFFF' }]}
        >
          <Text style={[styles.tabText, { color: tab === 'devis' ? Palette.primary : isDark ? Palette.slate[400] : Palette.slate[500] }]}>
            Devis
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (tab === 'factures') return;
            setTab('factures');
            setSearchQuery('');
            setStatusFilter(null);
            setDocuments([]);
            loadDocuments(true, '', 'factures', null);
          }}
          style={[styles.tabItem, tab === 'factures' && styles.tabActive, tab === 'factures' && { backgroundColor: isDark ? Palette.slate[700] : '#FFFFFF' }]}
        >
          <Text style={[styles.tabText, { color: tab === 'factures' ? Palette.primary : isDark ? Palette.slate[400] : Palette.slate[500] }]}>
            Factures
          </Text>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <View style={[styles.searchBox, { backgroundColor: isDark ? Palette.slate[800] : '#FFFFFF', borderColor: isDark ? Palette.slate[700] : Palette.slate[200] }]}>
          <Search size={18} color={isDark ? Palette.slate[400] : Palette.slate[500]} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? Palette.slate[50] : Palette.slate[900] }]}
            placeholder="Rechercher (N° ou client)..."
            placeholderTextColor={isDark ? Palette.slate[400] : Palette.slate[500]}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearch('')} style={{ padding: 4 }}>
              <X size={16} color={isDark ? Palette.slate[400] : Palette.slate[500]} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Status Filters */}
      <View style={{ marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          <Pressable 
            style={[styles.filterChip, { borderColor: isDark ? Palette.slate[700] : Palette.slate[200] }, !statusFilter && [styles.filterChipActive, { backgroundColor: Palette.primary }]]}
            onPress={() => { setStatusFilter(null); loadDocuments(true, searchQuery, tab, null); }}
          >
            <Text style={[styles.filterChipText, !statusFilter ? { color: '#FFF' } : { color: isDark ? Palette.slate[400] : Palette.slate[600] }]}>Tous</Text>
          </Pressable>
          {(tab === 'devis' ? QUOTE_STATUSES : INVOICE_STATUSES).map(s => (
            <Pressable 
              key={s} 
              style={[styles.filterChip, { borderColor: isDark ? Palette.slate[700] : Palette.slate[200] }, statusFilter === s && [styles.filterChipActive, { backgroundColor: Palette.primary }]]}
              onPress={() => { setStatusFilter(s); loadDocuments(true, searchQuery, tab, s); }}
            >
              <Text style={[styles.filterChipText, statusFilter === s ? { color: '#FFF' } : { color: isDark ? Palette.slate[400] : Palette.slate[600] }]}>{s}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {[...Array(6)].map((_, i) => (
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
      ) : documents.length === 0 && !isLoadingMore ? (
        <EmptyState
          icon={<FileText size={36} color={Palette.slate[400]} />}
          title={tab === 'devis' ? 'Aucun devis' : 'Aucune facture'}
          subtitle={tab === 'devis' ? 'Créez votre premier devis pour commencer.' : 'Créez votre première facture.'}
          actionLabel={tab === 'devis' ? 'Nouveau devis' : 'Nouvelle facture'}
          onAction={() => router.push({ pathname: '/documents/new', params: { type: tab === 'devis' ? 'quote' : 'invoice' } })}
        />
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 80 }}
          showsVerticalScrollIndicator={false}
          onEndReached={() => loadDocuments()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore && documents.length > 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: isDark ? Palette.slate[400] : Palette.slate[500] }}>Chargement...</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <SmartCard
              docNumber={item.number}
              clientName={item.clientName}
              total={item.total ?? 0}
              status={item.status ?? 'Brouillon'}
              date={item.dateStr}
              amountPaid={item.type === 'invoice' ? (item.amountPaid ?? undefined) : undefined}
              onPress={() => router.push(`/documents/${item.id}`)}
              renderRightActions={() => renderRightActions(item)}
              swipeableRef={(ref: any) => {
                if (ref) rowRefs.current.set(`${item.type}-${item.id}`, ref);
              }}
              onSwipeableWillOpen={() => handleSwipeableOpen(`${item.type}-${item.id}`)}
            />
          )}
        />
      )}

      <MessageModal
        visible={msgConfig.visible}
        title={msgConfig.title}
        message={msgConfig.message}
        type={msgConfig.type}
        onClose={() => {
          setMsgConfig((prev) => ({ ...prev, visible: false }));
          if (msgConfig.onCloseAction) msgConfig.onCloseAction();
        }}
        onConfirm={msgConfig.onConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginVertical: 12, borderRadius: 12, padding: 4 },
  tabItem: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '700' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterChipActive: { borderColor: 'transparent' },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  swipeBtn: { width: 50, height: '90%', justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginLeft: 8 },
});
