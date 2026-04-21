import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, FlatList, TextInput, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette } from '@/constants/Colors';
import { X, Search, Plus } from 'lucide-react-native';
import { db } from '@/db/client';
import { catalog } from '@/db/schema';

interface CatalogModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (item: { title: string; description: string; unitPrice: number }) => void;
}

export default function CatalogModal({ visible, onClose, onSelect }: CatalogModalProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (visible) {
      loadCatalog();
    }
  }, [visible]);

  async function loadCatalog() {
    try {
      const rows = await db.select().from(catalog);
      setItems(rows);
    } catch (e) {
      console.error(e);
    }
  }

  const filteredItems = search
    ? items.filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.description?.toLowerCase().includes(search.toLowerCase()))
    : items;

  const bgColor = isDark ? Palette.slate[800] : '#FFFFFF';
  const textColor = isDark ? Palette.slate[50] : Palette.slate[900];
  const border = isDark ? Palette.slate[700] : Palette.slate[200];
  const mutedText = isDark ? Palette.slate[400] : Palette.slate[500];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View style={[styles.content, { backgroundColor: bgColor, borderColor: border }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: textColor }]}>Ajouter une prestation</Text>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDark ? Palette.slate[700] : Palette.slate[100] }]}>
                <X size={20} color={mutedText} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchBox, { backgroundColor: isDark ? Palette.slate[900] : Palette.slate[50], borderColor: border }]}>
              <Search size={18} color={mutedText} />
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder="Rechercher dans le catalogue..."
                placeholderTextColor={mutedText}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <FlatList
              data={filteredItems}
              keyExtractor={(item) => String(item.id)}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.itemRow, { borderColor: border }]}
                  onPress={() => {
                    onSelect({
                      title: item.title,
                      description: item.description || '',
                      unitPrice: item.defaultPrice || 0,
                    });
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.itemTitle, { color: textColor }]}>{item.title}</Text>
                    {item.description ? <Text style={[styles.itemDesc, { color: mutedText }]} numberOfLines={2}>{item.description}</Text> : null}
                  </View>
                  <Text style={[styles.itemPrice, { color: Palette.primary }]}>{item.defaultPrice?.toFixed(2) ?? '0.00'} €</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <Text style={[styles.emptyText, { color: mutedText }]}>
                  {search ? 'Aucun résultat' : 'Catalogue vide'}
                </Text>
              )}
            />

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.manualBtn, { borderColor: Palette.primary }]}
                onPress={() => {
                  onSelect({ title: '', description: '', unitPrice: 0 });
                }}
              >
                <Plus size={18} color={Palette.primary} />
                <Text style={[styles.manualBtnText, { color: Palette.primary }]}>Saisie libre manuelle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    height: height * 0.8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    gap: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: 13,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 40,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  manualBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
