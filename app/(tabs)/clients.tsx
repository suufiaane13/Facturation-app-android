import React, { useCallback, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Plus, Users, Phone, Mail, ChevronRight, Trash2, Edit2, UserPlus } from 'lucide-react-native';
import { db } from '@/db/client';
import { clients } from '@/db/schema';
import { eq, desc, like, or, and } from 'drizzle-orm';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette } from '@/constants/Colors';
import SearchBar from '@/components/SearchBar';
import EmptyState from '@/components/EmptyState';
import FAB from '@/components/FAB';
import { Swipeable } from 'react-native-gesture-handler';
import MessageModal from '@/components/MessageModal';
import SkeletonLoader from '@/components/SkeletonLoader';
import * as Linking from 'expo-linking';

export default function ClientsScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  const [clientList, setClientList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
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
      loadClients(true, search);
      return () => {
        if (prevOpenedRow.current) {
          prevOpenedRow.current.close();
          prevOpenedRow.current = null;
        }
      };
    }, [])
  );

  async function loadClients(reset = false, query = search) {
    if (isLoadingMore) return;
    const currentPage = reset ? 0 : page;
    if (!reset && !hasMore) return;

    if (reset) setIsLoading(true);
    setIsLoadingMore(true);
    try {
      const conditions = [eq(clients.isArchived, false)];
      if (query) {
        conditions.push(
          or(
            like(clients.name, `%${query}%`),
            like(clients.phone, `%${query}%`)
          ) as any
        );
      }

      const fetched = await db.select().from(clients)
        .where(and(...conditions))
        .orderBy(desc(clients.createdAt))
        .limit(PAGE_SIZE)
        .offset(currentPage * PAGE_SIZE);

      if (reset) {
        setClientList(fetched);
      } else {
        setClientList(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newItems = fetched.filter(f => !existingIds.has(f.id));
          return [...prev, ...newItems];
        });
      }
      
      setHasMore(fetched.length === PAGE_SIZE);
      setPage(currentPage + 1);
    } catch (e) {
      console.error('Clients load error:', e);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }

  const handleSearch = (text: string) => {
    setSearch(text);
    loadClients(true, text);
  };

  const filtered = clientList; // Search is now done in DB

  function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  async function handleDelete(client: any) {
    showMessage('Confirmer', 'Voulez-vous archiver ce client ?', 'warning', undefined, async () => {
      try {
        await db.update(clients).set({ isArchived: true }).where(eq(clients.id, client.id));
        setMsgConfig(prev => ({ ...prev, visible: false }));
        loadClients();
      } catch (e) {
        showMessage('Erreur', 'Impossible de supprimer le client.', 'error');
      }
    });
  }

  const renderRightActions = (item: any) => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingRight: 16 }}>
        {item.phone && (
          <Pressable 
            style={[styles.swipeBtn, { backgroundColor: Palette.success }]}
            onPress={() => Linking.openURL(`tel:${item.phone}`)}
          >
            <Phone size={20} color="#FFF" />
          </Pressable>
        )}
        {item.email && (
          <Pressable 
            style={[styles.swipeBtn, { backgroundColor: Palette.primary }]}
            onPress={() => Linking.openURL(`mailto:${item.email}`)}
          >
            <Mail size={20} color="#FFF" />
          </Pressable>
        )}
        <Pressable 
          style={[styles.swipeBtn, { backgroundColor: isDark ? Palette.slate[600] : Palette.slate[400] }]}
          onPress={() => router.push({ pathname: '/clients/new', params: { editId: item.id.toString() } })}
        >
          <Edit2 size={20} color="#FFF" />
        </Pressable>
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
      <SearchBar value={search} onChangeText={handleSearch} placeholder="Rechercher un client..." />

      {isLoading ? (
        <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 8 }}>
          {[...Array(6)].map((_, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? Palette.slate[800] : '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: isDark ? Palette.slate[700] : Palette.slate[100] }}>
              <SkeletonLoader width={48} height={48} borderRadius={24} />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <SkeletonLoader width={140} height={16} style={{ marginBottom: 8 }} />
                <SkeletonLoader width={100} height={12} />
              </View>
              <SkeletonLoader width={20} height={20} borderRadius={10} />
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        onEndReached={() => loadClients()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore && clientList.length > 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: isDark ? Palette.slate[400] : Palette.slate[500] }}>Chargement...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon={<Users size={36} color={Palette.slate[400]} />}
            title={search ? 'Aucun résultat' : 'Aucun client'}
            subtitle={search ? 'Essayez un autre terme de recherche.' : 'Ajoutez votre premier client pour commencer.'}
            actionLabel={search ? undefined : 'Ajouter un client'}
            onAction={search ? undefined : () => router.push('/clients/new')}
          />
        }
        renderItem={({ item }) => (
          <Swipeable 
            renderRightActions={() => renderRightActions(item)} 
            containerStyle={{ overflow: 'visible' }}
            ref={(ref) => {
              if (ref) rowRefs.current.set(String(item.id), ref);
            }}
            onSwipeableWillOpen={() => handleSwipeableOpen(String(item.id))}
          >
            <Pressable
              onPress={() => router.push(`/clients/${item.id}`)}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: isDark ? Palette.slate[800] : '#FFFFFF',
                    borderColor: isDark ? Palette.slate[700] : Palette.slate[100],
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}
              >
                <View style={[styles.avatar, { backgroundColor: Palette.primary + '20' }]}>
                  <Text style={[styles.avatarText, { color: Palette.primary }]}>{getInitials(item.name)}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={[styles.name, { color: isDark ? Palette.slate[50] : Palette.slate[900] }]}>
                    {item.name}
                  </Text>
                  <View style={styles.meta}>
                    {item.phone && (
                      <View style={styles.metaRow}>
                        <Phone size={12} color={Palette.slate[400]} />
                        <Text style={[styles.metaText, { color: isDark ? Palette.slate[400] : Palette.slate[500] }]}>{item.phone}</Text>
                      </View>
                    )}
                    {item.email && (
                      <View style={styles.metaRow}>
                        <Mail size={12} color={Palette.slate[400]} />
                        <Text style={[styles.metaText, { color: isDark ? Palette.slate[400] : Palette.slate[500] }]}>{item.email}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <ChevronRight size={18} color={Palette.slate[400]} />
              </Pressable>
          </Swipeable>
        )}
      />
      )}

      <FAB
        icon={<UserPlus size={24} color="#FFF" />}
        onPress={() => router.push('/clients/new')}
      />

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
  card: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 14, borderWidth: 1, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '800' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  meta: { gap: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontWeight: '500' },
  swipeBtn: { width: 50, height: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 12, marginLeft: 8 },
});
