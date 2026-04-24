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
  onSelect: (items: { title: string; description: string; unitPrice: number }[]) => void;
}

export default function CatalogModal({ visible, onClose, onSelect }: CatalogModalProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (visible) {
      loadCatalog();
      setSelectedIds(new Set()); // Reset selection on open
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

  const toggleItem = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleConfirm = () => {
    const selectedList = items
      .filter(item => selectedIds.has(item.id))
      .map(item => ({
        title: item.title,
        description: item.description || '',
        unitPrice: item.defaultPrice || 0,
      }));
    
    if (selectedList.length > 0) {
      onSelect(selectedList);
    }
  };

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
              <View>
                <Text style={[styles.title, { color: textColor }]}>Catalogue</Text>
                {selectedIds.size > 0 && <Text style={{ color: Palette.primary, fontSize: 13, fontWeight: '600' }}>{selectedIds.size} sélectionné(s)</Text>}
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: isDark ? Palette.slate[700] : Palette.slate[100] }]}>
                <X size={20} color={mutedText} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchBox, { backgroundColor: isDark ? Palette.slate[900] : Palette.slate[50], borderColor: border }]}>
              <Search size={18} color={mutedText} />
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder="Rechercher..."
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
              renderItem={({ item }) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.itemRow, 
                      { 
                        borderColor: isSelected ? Palette.primary : border,
                        backgroundColor: isSelected ? (isDark ? Palette.primary + '15' : Palette.primary + '08') : 'transparent'
                      }
                    ]}
                    onPress={() => toggleItem(item.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: textColor }]}>{item.title}</Text>
                      {item.description ? <Text style={[styles.itemDesc, { color: mutedText }]} numberOfLines={2}>{item.description}</Text> : null}
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <Text style={[styles.itemPrice, { color: isSelected ? Palette.primary : textColor }]}>{item.defaultPrice?.toFixed(2) ?? '0.00'} €</Text>
                      <View style={[styles.checkbox, { borderColor: isSelected ? Palette.primary : border, backgroundColor: isSelected ? Palette.primary : 'transparent' }]}>
                        {isSelected && <X size={12} color="#FFF" style={{ transform: [{ rotate: '45deg' }] }} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={() => (
                <Text style={[styles.emptyText, { color: mutedText }]}>
                  {search ? 'Aucun résultat' : 'Catalogue vide'}
                </Text>
              )}
            />

            <View style={styles.footer}>
              {selectedIds.size > 0 ? (
                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: Palette.primary }]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmBtnText}>Ajouter la sélection ({selectedIds.size})</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.manualBtn, { borderColor: Palette.primary }]}
                  onPress={() => onSelect([{ title: '', description: '', unitPrice: 0 }])}
                >
                  <Plus size={18} color={Palette.primary} />
                  <Text style={[styles.manualBtnText, { color: Palette.primary }]}>Saisie libre manuelle</Text>
                </TouchableOpacity>
              )}
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
    height: height * 0.85,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
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
    fontSize: 22,
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
    borderRadius: 14,
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
    borderRadius: 18,
    borderWidth: 1.5,
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
    fontSize: 15,
    fontWeight: '800',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: 'rgba(150,150,150,0.1)',
  },
  manualBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  manualBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  confirmBtn: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
