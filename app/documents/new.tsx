import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, FlatList, TextInput, Alert, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Plus, ChevronLeft, ChevronRight, Check, Search } from 'lucide-react-native';
import { db } from '@/db/client';
import { clients, quotes, invoices, lineItems } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette } from '@/constants/Colors';
import StepperHeader from '@/components/StepperHeader';
import AccordionItem from '@/components/AccordionItem';
import CatalogModal from '@/components/CatalogModal';
import MessageModal from '@/components/MessageModal';

type LineItem = { title: string; description: string | null; unitPrice: number; quantity: number };
type Material = { name: string; price: number };

export default function NewDocumentScreen() {
  const { type, editId } = useLocalSearchParams<{ type: string; editId?: string }>();
  const isQuote = type !== 'invoice';
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const [step, setStep] = useState(0);
  const [clientList, setClientList] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [showCatalogModal, setShowCatalogModal] = useState(false);

  const [msgConfig, setMsgConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success' as 'success' | 'error' | 'warning',
    onCloseAction: undefined as (() => void) | undefined,
  });

  const showMessage = (title: string, message: string, type: 'success' | 'error' | 'warning' = 'success', onCloseAction?: () => void) => {
    setMsgConfig({ visible: true, title, message, type, onCloseAction });
  };

  // Load clients and potentially edit data on focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const all = await db.select().from(clients).orderBy(desc(clients.createdAt));
        setClientList(all);

        if (editId) {
          const id = parseInt(editId);
          const table = isQuote ? quotes : invoices;
          const docRes = await db.select().from(table).where(eq(table.id, id));
          if (docRes.length > 0) {
            const d = docRes[0];
            const c = all.find((cl) => cl.id === d.clientId);
            if (c) setSelectedClient(c);
            if (d.materials) setMaterials(JSON.parse(d.materials));
            
            // Le discount n'existe que sur les devis (quotes) dans le schéma
            if (isQuote && 'discount' in d && d.discount) {
              setDiscount(d.discount);
            }
            
            if (d.notes) setNotes(d.notes);

            const docItems = await db.select().from(lineItems).where(eq(lineItems.docId, id));
            setItems(docItems.filter(i => i.docType === (isQuote ? 'quote' : 'invoice')));
          }
        }
      })();
    }, [editId, isQuote])
  );

  const filteredClients = clientSearch
    ? clientList.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
    : clientList;

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const materialsTotal = materials.reduce((sum, m) => sum + m.price, 0);
  const grossTotal = subtotal + materialsTotal;
  const total = Math.max(0, grossTotal - discount);

  async function generateNumber() {
    const year = new Date().getFullYear();
    const prefix = isQuote ? 'DEV' : 'FAC';
    const table = isQuote ? quotes : invoices;
    const all = await db.select().from(table);
    
    // Find the highest sequence number for this year
    let maxSeq = 0;
    const yearPrefix = `${prefix}-${year}-`;
    
    all.forEach((d: any) => {
      const numStr = isQuote ? d.quoteNumber : d.invoiceNumber;
      if (numStr && numStr.startsWith(yearPrefix)) {
        const parts = numStr.split('-');
        const seq = parseInt(parts[parts.length - 1] || '0');
        if (seq > maxSeq) maxSeq = seq;
      }
    });

    const nextNum = String(maxSeq + 1).padStart(3, '0');
    return `${yearPrefix}${nextNum}`;
  }

  async function handleSubmit() {
    if (!selectedClient) {
      showMessage('Erreur', 'Veuillez sélectionner un client.', 'error');
      setStep(0);
      return;
    }
    if (items.length === 0 && materials.length === 0) {
      showMessage('Erreur', 'Ajoutez au moins une prestation ou un matériel.', 'error');
      setStep(1); // Go to prestations step
      return;
    }
    try {
      const materialsJson = materials.length > 0 ? JSON.stringify(materials) : null;

      if (editId) {
        const id = parseInt(editId);
        let finalNum = '';
        if (isQuote) {
          const q = await db.select().from(quotes).where(eq(quotes.id, id));
          finalNum = q[0]?.quoteNumber || 'DEV-XXX';
          await db.update(quotes).set({
            clientId: selectedClient.id,
            subtotal, discount, total, materials: materialsJson, notes: notes || null
          }).where(eq(quotes.id, id));
        } else {
          const inv = await db.select().from(invoices).where(eq(invoices.id, id));
          finalNum = inv[0]?.invoiceNumber || 'FAC-XXX';
          await db.update(invoices).set({
            clientId: selectedClient.id,
            total, balanceDue: total, materials: materialsJson, notes: notes || null
          }).where(eq(invoices.id, id));
        }

        // Replace items
        await db.delete(lineItems).where(eq(lineItems.docId, id));
        for (const item of items) {
          await db.insert(lineItems).values({
            docId: id,
            docType: isQuote ? 'quote' : 'invoice',
            title: item.title, description: item.description || null,
            unitPrice: item.unitPrice, quantity: item.quantity, total: item.unitPrice * item.quantity
          });
        }
        showMessage('Modifié', `Document ${finalNum} mis à jour avec succès.`, 'success', () => router.back());
        return;
      }

      // New document (INSERT)
      const docNumber = await generateNumber();

      if (isQuote) {
        const result = await db.insert(quotes).values({
          quoteNumber: docNumber,
          clientId: selectedClient.id,
          subtotal,
          discount,
          total,
          materials: materialsJson,
          notes: notes || null,
        }).returning();
        const docId = result[0].id;
        for (const item of items) {
          await db.insert(lineItems).values({
            docId,
            docType: 'quote',
            title: item.title,
            description: item.description || null,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            total: item.unitPrice * item.quantity,
          });
        }
      } else {
        const result = await db.insert(invoices).values({
          invoiceNumber: docNumber,
          clientId: selectedClient.id,
          total,
          balanceDue: total,
          materials: materialsJson,
          notes: notes || null,
        }).returning();
        const docId = result[0].id;
        for (const item of items) {
          await db.insert(lineItems).values({
            docId,
            docType: 'invoice',
            title: item.title,
            description: item.description || null,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            total: item.unitPrice * item.quantity,
          });
        }
      }
      showMessage('Créé', `${isQuote ? 'Devis' : 'Facture'} ${docNumber} créé(e) avec succès.`, 'success', () => router.back());
    } catch (e) {
      console.error('Save error:', e);
      showMessage('Erreur', 'Impossible de sauvegarder.', 'error');
    }
  }

  const bg = isDark ? Palette.slate[900] : Palette.slate[50];
  const cardBg = isDark ? Palette.slate[800] : '#FFFFFF';
  const border = isDark ? Palette.slate[700] : Palette.slate[200];
  const textPrimary = isDark ? Palette.slate[50] : Palette.slate[900];
  const textSecondary = isDark ? Palette.slate[400] : Palette.slate[500];

  const inputStyle = [styles.input, { color: textPrimary, backgroundColor: cardBg, borderColor: border }];

  // ─── Step 0: Client Selection ───
  function renderClientStep() {
    return (
      <View style={styles.stepContainer}>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
          <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: border, flex: 1, marginBottom: 0 }]}>
            <Search size={16} color={textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: textPrimary }]}
              placeholder="Rechercher un client..."
              placeholderTextColor={Palette.slate[400]}
              value={clientSearch}
              onChangeText={setClientSearch}
            />
          </View>
          <Pressable
            onPress={() => router.push('/clients/new')}
            style={[styles.addSmallBtn, { backgroundColor: Palette.primary }]}
          >
            <Plus size={20} color="#FFF" />
          </Pressable>
        </View>
        <FlatList
          data={filteredClients}
          keyExtractor={c => String(c.id)}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedClient(item)}
              style={[styles.clientRow, {
                backgroundColor: selectedClient?.id === item.id ? (isDark ? '#FFFFFF10' : Palette.primary + '15') : cardBg,
                borderColor: selectedClient?.id === item.id ? (isDark ? '#FFFFFF' : Palette.primary) : border,
              }]}
            >
              <View style={[styles.clientAvatar, { backgroundColor: isDark ? Palette.slate[700] : Palette.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: isDark ? '#FFF' : Palette.primary }]}>
                  {item.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.clientName, { color: textPrimary }]}>{item.name}</Text>
                {item.phone && <Text style={[styles.clientMeta, { color: textSecondary }]}>{item.phone}</Text>}
              </View>
              {selectedClient?.id === item.id && <Check size={20} color={isDark ? '#FFF' : Palette.primary} />}
            </Pressable>
          )}
        />
      </View>
    );
  }

  // ─── Step 1: Prestations ───
  function renderPrestationsStep() {
    return (
      <KeyboardAwareScrollView style={styles.stepContainer} contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled" enableOnAndroid={true} extraScrollHeight={40}>
        {items.map((item, i) => (
          <AccordionItem
            key={i}
            title={item.title}
            description={item.description}
            unitPrice={item.unitPrice}
            quantity={item.quantity}
            onUpdate={(data) => {
              const newItems = [...items];
              newItems[i] = data;
              setItems(newItems);
            }}
            onDelete={() => setItems(items.filter((_, idx) => idx !== i))}
          />
        ))}
        <Pressable
          onPress={() => setShowCatalogModal(true)}
          style={[styles.addBtn, { borderColor: Palette.primary }]}
        >
          <Plus size={18} color={Palette.primary} />
          <Text style={[styles.addBtnText, { color: Palette.primary }]}>Ajouter une prestation</Text>
        </Pressable>
        <View style={[styles.totalBar, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.totalLabel, { color: textSecondary }]}>Sous-total prestations</Text>
          <Text style={[styles.totalValue, { color: Palette.primary }]}>{subtotal.toFixed(2)} €</Text>
        </View>
      </KeyboardAwareScrollView>
    );
  }

  // ─── Step 2: Matériels ───
  function renderMaterialsStep() {
    return (
      <KeyboardAwareScrollView style={styles.stepContainer} contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled" enableOnAndroid={true} extraScrollHeight={40}>
        {materials.map((mat, i) => (
          <View key={i} style={[styles.matRow, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={{ flex: 2 }}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Nom</Text>
              <TextInput
                style={inputStyle}
                value={mat.name}
                onChangeText={(v) => { const m = [...materials]; m[i].name = v; setMaterials(m); }}
                placeholder="Ex: Tuyau PVC"
                placeholderTextColor={Palette.slate[400]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: textSecondary }]}>Prix (€)</Text>
              <TextInput
                style={inputStyle}
                value={String(mat.price)}
                onChangeText={(v) => { const m = [...materials]; m[i].price = parseFloat(v) || 0; setMaterials(m); }}
                keyboardType="decimal-pad"
              />
            </View>
            <Pressable onPress={() => setMaterials(materials.filter((_, idx) => idx !== i))} style={styles.matDelete}>
              <Text style={{ color: Palette.danger, fontWeight: '700' }}>✕</Text>
            </Pressable>
          </View>
        ))}
        <Pressable
          onPress={() => setMaterials([...materials, { name: '', price: 0 }])}
          style={[styles.addBtn, { borderColor: Palette.primary }]}
        >
          <Plus size={18} color={Palette.primary} />
          <Text style={[styles.addBtnText, { color: Palette.primary }]}>Ajouter un matériel</Text>
        </Pressable>
        <View style={[styles.totalBar, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.totalLabel, { color: textSecondary }]}>Sous-total matériels</Text>
          <Text style={[styles.totalValue, { color: Palette.primary }]}>{materialsTotal.toFixed(2)} €</Text>
        </View>
      </KeyboardAwareScrollView>
    );
  }

  // ─── Step 3: Récapitulatif ───
  function renderSummaryStep() {
    return (
      <KeyboardAwareScrollView style={styles.stepContainer} contentContainerStyle={{ paddingBottom: 20 }} keyboardShouldPersistTaps="handled" enableOnAndroid={true} extraScrollHeight={40}>
        {/* Client */}
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.summaryTitle, { color: textSecondary }]}>Client</Text>
          <Text style={[styles.summaryValue, { color: textPrimary }]}>{selectedClient?.name ?? '—'}</Text>
        </View>
        {/* Prestations */}
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.summaryTitle, { color: textSecondary }]}>Prestations ({items.length})</Text>
          {items.map((item, i) => (
            <View key={i} style={styles.summaryRow}>
              <Text style={[styles.summaryItem, { color: textPrimary }]}>{item.title || 'Sans titre'}</Text>
              <Text style={[styles.summaryItemPrice, { color: Palette.primary }]}>{(item.unitPrice * item.quantity).toFixed(2)} €</Text>
            </View>
          ))}
        </View>
        {/* Matériels */}
        {materials.length > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.summaryTitle, { color: textSecondary }]}>Matériels ({materials.length})</Text>
            {materials.map((m, i) => (
              <View key={i} style={styles.summaryRow}>
                <Text style={[styles.summaryItem, { color: textPrimary }]}>{m.name || 'Sans nom'}</Text>
                <Text style={[styles.summaryItemPrice, { color: Palette.primary }]}>{m.price.toFixed(2)} €</Text>
              </View>
            ))}
          </View>
        )}
        {/* Discount & Notes */}
        <View style={[styles.summaryCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: textSecondary }]}>Remise (€)</Text>
            <TextInput style={inputStyle} value={String(discount)} onChangeText={(v) => setDiscount(parseFloat(v) || 0)} keyboardType="decimal-pad" />
          </View>
          <View style={[styles.field, { marginTop: 12 }]}>
            <Text style={[styles.fieldLabel, { color: textSecondary }]}>Notes</Text>
            <TextInput style={[...inputStyle, { minHeight: 60, textAlignVertical: 'top' }]} value={notes} onChangeText={setNotes} placeholder="Remarques..." placeholderTextColor={Palette.slate[400]} multiline />
          </View>
        </View>
        {/* Totals */}
        <View style={[styles.totalsCard, { backgroundColor: cardBg, borderColor: border }]}>
          <View style={styles.totalRow}><Text style={[styles.totalRowLabel, { color: textSecondary }]}>Prestations</Text><Text style={[styles.totalRowVal, { color: textPrimary }]}>{subtotal.toFixed(2)} €</Text></View>
          <View style={styles.totalRow}><Text style={[styles.totalRowLabel, { color: textSecondary }]}>Matériels</Text><Text style={[styles.totalRowVal, { color: textPrimary }]}>{materialsTotal.toFixed(2)} €</Text></View>
          {discount > 0 && <View style={styles.totalRow}><Text style={[styles.totalRowLabel, { color: Palette.danger }]}>Remise</Text><Text style={[styles.totalRowVal, { color: Palette.danger }]}>-{discount.toFixed(2)} €</Text></View>}
          <View style={[styles.divider, { backgroundColor: border }]} />
          <View style={styles.totalRow}><Text style={[styles.grandTotalLabel, { color: textPrimary }]}>TOTAL NET</Text><Text style={[styles.grandTotalVal, { color: Palette.danger }]}>{total.toFixed(2)} €</Text></View>
        </View>
      </KeyboardAwareScrollView>
    );
  }

  const stepContent = [renderClientStep, renderPrestationsStep, renderMaterialsStep, renderSummaryStep];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StepperHeader currentStep={step} />
      <View style={styles.body}>{stepContent[step]()}</View>
      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: cardBg, borderTopColor: border }]}>
        {step > 0 ? (
          <Pressable onPress={() => setStep(step - 1)} style={[styles.navBtn, { borderColor: Palette.primary }]}>
            <ChevronLeft size={18} color={Palette.primary} />
            <Text style={[styles.navBtnText, { color: Palette.primary }]}>Précédent</Text>
          </Pressable>
        ) : <View style={{ flex: 1 }} />}

        {step < 3 ? (
          <Pressable onPress={() => setStep(step + 1)} style={[styles.navBtnFilled, { backgroundColor: Palette.primary }]}>
            <Text style={styles.navBtnFilledText}>Suivant</Text>
            <ChevronRight size={18} color="#FFF" />
          </Pressable>
        ) : (
          <Pressable onPress={() => {
            if (!selectedClient) return showMessage('Erreur', 'Veuillez sélectionner un client.', 'error');
            if (items.length === 0 && materials.length === 0) return showMessage('Erreur', 'Ajoutez au moins une prestation ou un matériel.', 'error');
            handleSubmit();
          }} style={[styles.navBtnFilled, { backgroundColor: Palette.success }]}>
            <Check size={18} color="#FFF" />
            <Text style={styles.navBtnFilledText}>Valider</Text>
          </Pressable>
        )}
      </View>

      <CatalogModal
        visible={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        onSelect={(selectedItem) => {
          setItems([...items, { ...selectedItem, quantity: 1 }]);
          setShowCatalogModal(false);
        }}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  body: { flex: 1 },
  stepContainer: { flex: 1, padding: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  clientRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1.5, marginBottom: 8, gap: 12 },
  clientAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '800' },
  clientName: { fontSize: 15, fontWeight: '700' },
  clientMeta: { fontSize: 12, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', marginTop: 8 },
  addBtnText: { fontSize: 14, fontWeight: '700' },
  totalBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginTop: 16 },
  totalLabel: { fontSize: 13, fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: '800' },
  matRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  matDelete: { paddingBottom: 12, paddingHorizontal: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14 },
  field: {},
  summaryCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  summaryTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryItem: { fontSize: 14 },
  summaryItemPrice: { fontSize: 14, fontWeight: '700' },
  totalsCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginTop: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalRowLabel: { fontSize: 14 },
  totalRowVal: { fontSize: 14, fontWeight: '600' },
  divider: { height: 1, marginVertical: 10 },
  grandTotalLabel: { fontSize: 16, fontWeight: '800' },
  grandTotalVal: { fontSize: 20, fontWeight: '800' },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, gap: 12 },
  navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5 },
  navBtnText: { fontSize: 14, fontWeight: '700' },
  navBtnFilled: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, borderRadius: 12 },
  navBtnFilledText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  addSmallBtn: { width: 46, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
