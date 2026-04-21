import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Modal, TouchableOpacity, Linking } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { FileDown, RefreshCw, CreditCard, Printer, Edit2, ChevronLeft, Share, Trash2, Plus, Banknote } from 'lucide-react-native';
import { db } from '@/db/client';
import { quotes, invoices, lineItems, clients, payments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useColorScheme } from '@/components/useColorScheme';
import { Palette } from '@/constants/Colors';
import StatusBadge from '@/components/StatusBadge';
import { generateAndSharePDF, emailPdf, sharePdfViaWhatsApp } from '@/utils/pdfGenerator';
import StatusModal from '@/components/StatusModal';
import MessageModal from '@/components/MessageModal';
import PaymentModal from '@/components/PaymentModal';
import { Mail, MessageCircle } from 'lucide-react-native';


export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const [doc, setDoc] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [materialsList, setMaterialsList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [docType, setDocType] = useState<'quote' | 'invoice'>('quote');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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

  useFocusEffect(
    useCallback(() => {
      loadDocument();
    }, [id])
  );

  async function loadDocument() {
    const docId = parseInt(id ?? '0');
    if (!docId) return;

    // Try quote first
    const q = await db.select().from(quotes).where(eq(quotes.id, docId));
    if (q.length > 0) {
      setDoc(q[0]);
      setDocType('quote');
      const c = await db.select().from(clients).where(eq(clients.id, q[0].clientId));
      setClient(c[0] ?? null);
      const li = await db.select().from(lineItems).where(eq(lineItems.docId, docId));
      setItems(li.filter(l => l.docType === 'quote'));
      try {
        setMaterialsList(q[0].materials ? JSON.parse(q[0].materials) : []);
      } catch { setMaterialsList([]); }
      return;
    }

    // Try invoice
    const inv = await db.select().from(invoices).where(eq(invoices.id, docId));
    if (inv.length > 0) {
      setDoc(inv[0]);
      setDocType('invoice');
      const c = await db.select().from(clients).where(eq(clients.id, inv[0].clientId));
      setClient(c[0] ?? null);
      const li = await db.select().from(lineItems).where(eq(lineItems.docId, docId));
      setItems(li.filter(l => l.docType === 'invoice'));
      try {
        setMaterialsList(inv[0].materials ? JSON.parse(inv[0].materials) : []);
      } catch { setMaterialsList([]); }
      const pList = await db.select().from(payments).where(eq(payments.invoiceId, docId));
      setPaymentsList(pList);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!doc) return;
    try {
      if (docType === 'quote') {
        await db.update(quotes).set({ status: newStatus as any }).where(eq(quotes.id, doc.id));
      } else {
        await db.update(invoices).set({ status: newStatus as any }).where(eq(invoices.id, doc.id));
      }
      loadDocument();
      showMessage('Succès', `Statut mis à jour : ${newStatus}`, 'success');
    } catch (e) {
      showMessage('Erreur', 'Impossible de changer le statut.', 'error');
    }
  }

  async function handleSavePayment(amount: number, method: string, notes: string) {
    if (!doc || docType !== 'invoice') return;
    try {
      await db.insert(payments).values({
        invoiceId: doc.id,
        amount,
        method: method as any,
        notes: notes || null,
      });
      const newAmountPaid = (doc.amountPaid || 0) + amount;
      const newBalanceDue = (doc.total || 0) - newAmountPaid;
      const newStatus = newBalanceDue <= 0 ? 'Payée' : 'Partielle';
      await db.update(invoices).set({
        amountPaid: newAmountPaid,
        balanceDue: Math.max(0, newBalanceDue),
        status: newStatus
      }).where(eq(invoices.id, doc.id));
      
      setShowPaymentModal(false);
      loadDocument();
      showMessage('Paiement enregistré', `Un acompte de ${amount.toFixed(2)}€ a été ajouté.`, 'success');
    } catch (e) {
      showMessage('Erreur', 'Impossible d\'enregistrer le paiement.', 'error');
    }
  }

  async function handleShareWhatsApp() {
    if (!doc) return;
    
    // Step 1: Open chat to pre-select contact in "Recents"
    if (client?.phone) {
      const cleanPhone = client.phone.replace(/[^0-9]/g, '');
      const waUrl = `https://wa.me/${cleanPhone}`;
      try {
        await Linking.openURL(waUrl);
      } catch (e) {
        console.log("Could not open WhatsApp direct link", e);
      }
    }

    // Step 2: Open file share sheet
    const path = await generateAndSharePDF({
      doc, client, items, materials: materialsList, docType, action: 'none'
    });
    if (path) await sharePdfViaWhatsApp(path);
  }

  async function handleShareEmail() {
    if (!doc) return;
    const path = await generateAndSharePDF({
      doc, client, items, materials: materialsList, docType, action: 'none'
    });
    if (path) {
      const docLabel = docType === 'quote' ? 'Devis' : 'Facture';
      const docNum = docType === 'quote' ? doc.quoteNumber : doc.invoiceNumber;
      await emailPdf(
        path,
        client?.email || '',
        `${docLabel} ${docNum} - AD Services`,
        `Bonjour ${client?.name || ''},\n\nVeuillez trouver ci-joint votre ${docLabel.toLowerCase()} n°${docNum}.\n\nCordialement,\nAD Services`
      );
    }
  }

  async function handleConvertToInvoice() {
    if (!doc || docType !== 'quote') return;
    try {
      const year = new Date().getFullYear();
      const allInv = await db.select().from(invoices);
      const num = `FAC-${year}-${String(allInv.length + 1).padStart(3, '0')}`;

      const result = await db.insert(invoices).values({
        invoiceNumber: num,
        clientId: doc.clientId,
        quoteId: doc.id,
        total: doc.total ?? 0,
        balanceDue: doc.total ?? 0,
        materials: doc.materials,
        notes: doc.notes,
      }).returning();

      // Copy line items
      for (const item of items) {
        await db.insert(lineItems).values({
          docId: result[0].id,
          docType: 'invoice',
          title: item.title,
          description: item.description,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          total: item.total,
        });
      }

      await db.update(quotes).set({ status: 'Facturé' }).where(eq(quotes.id, doc.id));
      showMessage('Converti', `Facture ${num} créée avec succès.`, 'success', () => router.back());
    } catch (e) {
      showMessage('Erreur', 'Impossible de convertir.', 'error');
    }
  }

  if (!doc) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: isDark ? Palette.slate[900] : Palette.slate[50] }]}>
        <Text style={{ color: isDark ? Palette.slate[400] : Palette.slate[500] }}>Chargement...</Text>
      </View>
    );
  }

  const docNumber = docType === 'quote' ? doc.quoteNumber : doc.invoiceNumber;

  const cardBg = isDark ? Palette.slate[800] : '#FFFFFF';
  const border = isDark ? Palette.slate[700] : Palette.slate[200];
  const textPrimary = isDark ? Palette.slate[50] : Palette.slate[900];
  const textSecondary = isDark ? Palette.slate[400] : Palette.slate[500];

  const quoteStatuses = ['Brouillon', 'Envoyé', 'Signé', 'Refusé'];
  const invoiceStatuses = ['Brouillon', 'En attente', 'Partielle', 'Payée', 'En retard'];
  const statusOptions = docType === 'quote' ? quoteStatuses : invoiceStatuses;

  return (
    <>
      <ScrollView
      style={[styles.container, { backgroundColor: isDark ? Palette.slate[900] : Palette.slate[50] }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
        <View style={styles.docHeader}>
          <View>
            <Text style={[styles.docNumber, { color: textSecondary }]}>{docNumber}</Text>
            <Text style={[styles.docDate, { color: textSecondary }]}>
              {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('fr-FR') : ''}
            </Text>
          </View>
          <StatusBadge status={doc.status} />
        </View>
        <Text style={[styles.clientNameBig, { color: textPrimary }]}>{client?.name ?? 'Client inconnu'}</Text>
        {client?.address && <Text style={[styles.clientAddress, { color: textSecondary }]}>{client.address}</Text>}
      </View>

      {/* Line Items */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
        <Text style={[styles.sectionTitle, { color: textSecondary }]}>PRESTATIONS</Text>
        {items.map((item, i) => (
          <View key={i} style={[styles.lineItem, i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, { color: textPrimary }]}>{item.title}</Text>
              {item.description && <Text style={[styles.itemDesc, { color: textSecondary }]}>{item.description}</Text>}
              <Text style={[styles.itemMeta, { color: textSecondary }]}>{item.quantity} × {item.unitPrice.toFixed(2)} €</Text>
            </View>
            <Text style={[styles.itemTotal, { color: Palette.danger }]}>{item.total.toFixed(2)} €</Text>
          </View>
        ))}
      </View>

      {/* Materials */}
      {materialsList.length > 0 && (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: textSecondary }]}>MATÉRIELS</Text>
          {materialsList.map((m: any, i: number) => (
            <View key={i} style={styles.matLine}>
              <Text style={[styles.matName, { color: textPrimary }]}>{m.name}</Text>
              <Text style={[styles.matPrice, { color: Palette.danger }]}>{m.price.toFixed(2)} €</Text>
            </View>
          ))}
        </View>
      )}

      {/* Totals */}
      <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
        {doc.discount > 0 && (
          <View style={styles.totalLine}>
            <Text style={[{ color: Palette.danger }]}>Remise</Text>
            <Text style={[{ color: Palette.danger, fontWeight: '700' }]}>-{doc.discount.toFixed(2)} €</Text>
          </View>
        )}
        <View style={styles.totalLine}>
          <Text style={[styles.grandLabel, { color: textPrimary }]}>TOTAL</Text>
          <Text style={[styles.grandValue, { color: Palette.danger }]}>{(doc.total ?? 0).toFixed(2)} €</Text>
        </View>
        {docType === 'invoice' && (
          <>
            <View style={[styles.totalLine, { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: border }]}>
              <Text style={[{ color: textSecondary }]}>Déjà payé</Text>
              <Text style={[{ color: textPrimary, fontWeight: '700' }]}>{(doc.amountPaid ?? 0).toFixed(2)} €</Text>
            </View>
            <View style={styles.totalLine}>
              <Text style={[styles.grandLabel, { color: textPrimary }]}>RESTE À PAYER</Text>
              <Text style={[styles.grandValue, { color: Palette.danger }]}>{(doc.balanceDue ?? doc.total ?? 0).toFixed(2)} €</Text>
            </View>
          </>
        )}
      </View>

      {/* Notes */}
      {doc.notes && (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: textSecondary }]}>NOTES</Text>
          <Text style={[{ color: textPrimary, lineHeight: 20 }]}>{doc.notes}</Text>
        </View>
      )}

      {/* Historique des paiements */}
      {docType === 'invoice' && paymentsList.length > 0 && (
        <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: textSecondary }]}>HISTORIQUE DES PAIEMENTS</Text>
          {paymentsList.map((p, i) => (
            <View key={i} style={[styles.matLine, i < paymentsList.length - 1 && { borderBottomWidth: 1, borderBottomColor: border, paddingBottom: 8, marginBottom: 8 }]}>
              <View>
                <Text style={[{ color: textPrimary, fontWeight: '600' }]}>{p.method}</Text>
                <Text style={[{ color: textSecondary, fontSize: 12 }]}>{new Date(p.paidAt).toLocaleDateString('fr-FR')}</Text>
                {p.notes && <Text style={[{ color: textSecondary, fontSize: 12, fontStyle: 'italic' }]}>{p.notes}</Text>}
              </View>
              <Text style={[{ color: Palette.success, fontWeight: '800' }]}>+{p.amount.toFixed(2)} €</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.primaryAction, { backgroundColor: Palette.primary }]}
          onPress={() => generateAndSharePDF({ doc, client, items, materials: materialsList, docType })}
        >
          <Printer size={20} color="#FFF" />
          <Text style={styles.primaryActionText}>Générer le PDF</Text>
        </Pressable>

        <View style={styles.secondaryActionsRow}>
          <Pressable
            style={[styles.secondaryAction, { backgroundColor: Palette.danger }]}
            onPress={handleShareWhatsApp}
          >
            <FontAwesome name="whatsapp" size={20} color="#FFF" />
            <Text style={styles.secondaryActionText}>WhatsApp</Text>
          </Pressable>

          <Pressable
            style={[styles.secondaryAction, { backgroundColor: isDark ? Palette.slate[800] : Palette.slate[700] }]}
            onPress={handleShareEmail}
          >
            <Mail size={18} color="#FFF" />
            <Text style={styles.secondaryActionText}>Gmail</Text>
          </Pressable>
        </View>

        <View style={styles.secondaryActionsRow}>
          {doc.status === 'Brouillon' && (
            <Pressable
              style={[styles.secondaryAction, { backgroundColor: isDark ? Palette.slate[800] : Palette.slate[100], borderWidth: 1, borderColor: isDark ? Palette.slate[700] : Palette.slate[200] }]}
              onPress={() => router.push({ pathname: '/documents/new', params: { type: docType, editId: doc.id.toString() } })}
            >
              <Edit2 size={18} color={isDark ? '#FFF' : Palette.slate[900]} />
              <Text style={[styles.secondaryActionText, { color: isDark ? '#FFF' : Palette.slate[900] }]}>Modifier</Text>
            </Pressable>
          )}

          <Pressable
            style={[styles.secondaryAction, { backgroundColor: isDark ? Palette.slate[800] : Palette.slate[100], borderWidth: 1, borderColor: isDark ? Palette.slate[700] : Palette.slate[200] }]}
            onPress={() => setShowStatusModal(true)}
          >
            <RefreshCw size={18} color={isDark ? '#FFF' : Palette.slate[900]} />
            <Text style={[styles.secondaryActionText, { color: isDark ? '#FFF' : Palette.slate[900] }]}>Changer Statut</Text>
          </Pressable>
        </View>

        {docType === 'quote' && doc.status === 'Signé' && (
          <Pressable
            style={[styles.primaryAction, { backgroundColor: Palette.danger, marginTop: 8 }]}
            onPress={handleConvertToInvoice}
          >
            <FileDown size={20} color="#FFF" />
            <Text style={styles.primaryActionText}>Convertir en Facture</Text>
          </Pressable>
        )}

        {docType === 'invoice' && (doc.balanceDue ?? doc.total ?? 0) > 0 && (
          <Pressable
            style={[styles.primaryAction, { backgroundColor: Palette.success, marginTop: 8 }]}
            onPress={() => setShowPaymentModal(true)}
          >
            <Banknote size={20} color="#FFF" />
            <Text style={styles.primaryActionText}>Enregistrer un Paiement</Text>
          </Pressable>
        )}
      </View>

      <StatusModal
        visible={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        options={statusOptions}
        currentStatus={doc.status}
        onSelect={handleStatusChange}
      />
    </ScrollView>
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
      <PaymentModal
        visible={showPaymentModal}
        maxAmount={doc?.balanceDue ?? doc?.total ?? 0}
        onClose={() => setShowPaymentModal(false)}
        onSave={handleSavePayment}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 10 },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  docNumber: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  docDate: { fontSize: 12, marginTop: 2 },
  clientNameBig: { fontSize: 20, fontWeight: '800' },
  clientAddress: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  lineItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  itemTitle: { fontSize: 14, fontWeight: '700' },
  itemDesc: { fontSize: 12, marginTop: 2 },
  itemMeta: { fontSize: 12, marginTop: 4 },
  itemTotal: { fontSize: 15, fontWeight: '800' },
  matLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  matName: { fontSize: 14 },
  matPrice: { fontSize: 14, fontWeight: '700' },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  grandLabel: { fontSize: 16, fontWeight: '800' },
  grandValue: { fontSize: 22, fontWeight: '800' },
  actions: { marginTop: 12, gap: 10 },
  primaryAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  primaryActionText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  secondaryActionsRow: { flexDirection: 'row', gap: 10 },
  secondaryAction: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  secondaryActionText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});
