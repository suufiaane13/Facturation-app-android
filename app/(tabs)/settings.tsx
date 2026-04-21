import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform, Image, ScrollView, KeyboardAvoidingView, Modal } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Swipeable } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useFocusEffect } from 'expo-router';
import { Save, Building2, Plus, Edit2, Trash2, X, Moon, Sun, Smartphone, Layers, Tag, AlignLeft, Euro, Settings as SettingsIcon, BookOpen, Database } from 'lucide-react-native';
import { db } from '@/db/client';
import { companySettings, catalog } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useColorScheme } from '@/components/useColorScheme';
import { useThemeContext } from '@/components/ThemeProvider';
import { Palette } from '@/constants/Colors';
import MessageModal from '@/components/MessageModal';
import FAB from '@/components/FAB';

export default function SettingsScreen() {
  const { themePref, setThemePref } = useThemeContext();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';

  const [activeTab, setActiveTab] = useState<'company' | 'catalog' | 'preferences'>('company');

  const [form, setForm] = useState({
    companyName: '',
    siret: '',
    address: '',
    email: '',
    phone: '',
    website: '',
    defaultNotes: '',
    logoBase64: '',
  });

  // Catalog State
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [catForm, setCatForm] = useState({ title: '', description: '', defaultPrice: '0' });

  // Logo Preview State
  const [showLogoPreview, setShowLogoPreview] = useState(false);

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
      loadSettings();
    }, [])
  );

  async function loadSettings() {
    try {
      const rows = await db.select().from(companySettings);
      if (rows.length > 0) {
        const s = rows[0];
        setForm({
          companyName: s.companyName ?? '',
          siret: s.siret ?? '',
          address: s.address ?? '',
          email: s.email ?? '',
          phone: s.phone ?? '',
          website: s.website ?? '',
          defaultNotes: s.defaultNotes ?? '',
          logoBase64: s.logoBase64 ?? '',
        });
      }

      const catRows = await db.select().from(catalog);
      setCatalogItems(catRows);
    } catch (e) {
      console.error('Settings load error:', e);
    }
  }

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      setForm({ ...form, logoBase64: `data:image/jpeg;base64,${result.assets[0].base64}` });
    }
  };

  async function handleSaveCompany() {
    try {
      const rows = await db.select().from(companySettings);
      if (rows.length === 0) {
        await db.insert(companySettings).values(form);
      } else {
        await db.update(companySettings).set(form).where(eq(companySettings.id, rows[0].id));
      }
      showMessage('Sauvegardé', 'Vos paramètres ont été enregistrés.', 'success');
    } catch (e) {
      console.error('Settings save error:', e);
      showMessage('Erreur', 'Impossible de sauvegarder.', 'error');
    }
  }

  async function handleSaveCatalogItem() {
    try {
      if (!catForm.title) {
        showMessage('Erreur', 'Le titre est requis.', 'error');
        return;
      }
      const price = parseFloat(catForm.defaultPrice) || 0;
      if (editingCat) {
        await db.update(catalog).set({
          title: catForm.title,
          description: catForm.description,
          defaultPrice: price
        }).where(eq(catalog.id, editingCat.id));
      } else {
        await db.insert(catalog).values({
          title: catForm.title,
          description: catForm.description,
          defaultPrice: price
        });
      }
      setShowCatModal(false);
      loadSettings();
    } catch (e) {
      showMessage('Erreur', 'Impossible de sauvegarder la prestation.', 'error');
    }
  }

  async function handleDeleteCatalogItem(id: number) {
    showMessage('Confirmer', 'Supprimer cette prestation ?', 'warning', undefined, async () => {
      try {
        await db.delete(catalog).where(eq(catalog.id, id));
        loadSettings();
        setMsgConfig(prev => ({ ...prev, visible: false }));
      } catch (e) {
        showMessage('Erreur', 'Impossible de supprimer.', 'error');
      }
    });
  }

  const exportDatabase = async () => {
    try {
      // In Expo SQLite, the db is stored in documentDirectory/SQLite/
      const dbName = 'ad_services.db';
      const sourcePath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
      const targetPath = `${FileSystem.cacheDirectory}${dbName}`;
      
      // Copy to cache directory to ensure a safe, shareable file:// URI
      await FileSystem.copyAsync({
        from: sourcePath,
        to: targetPath
      });

      if (!(await Sharing.isAvailableAsync())) {
        showMessage('Erreur', "Le partage n'est pas disponible sur cet appareil.", 'error');
        return;
      }

      await Sharing.shareAsync(targetPath, {
        mimeType: 'application/x-sqlite3',
        dialogTitle: 'Sauvegarde Base de Données AD Services',
      });
      
    } catch (e) {
      console.error('Backup error:', e);
      showMessage('Erreur', 'Échec lors de la sauvegarde.', 'error');
    }
  };

  const inputStyle = [styles.input, {
    color: isDark ? Palette.slate[50] : Palette.slate[900],
    backgroundColor: isDark ? Palette.slate[800] : '#FFFFFF',
    borderColor: isDark ? Palette.slate[700] : Palette.slate[200],
  }];

  const labelStyle = [styles.label, { color: isDark ? Palette.slate[300] : Palette.slate[600] }];

  return (
    <>
    <View style={[styles.container, { backgroundColor: isDark ? Palette.slate[900] : Palette.slate[50] }]}>
      
      {/* Tabs Header - Segmented Control Style */}
      <View style={[styles.tabsWrapper, { backgroundColor: isDark ? Palette.slate[900] : '#FFFFFF' }]}>
        <View style={[styles.segmentedControl, { backgroundColor: isDark ? Palette.slate[800] : Palette.slate[100] }]}>
          <Pressable 
            style={[styles.segmentBtn, activeTab === 'company' && styles.segmentBtnActive, activeTab === 'company' && { backgroundColor: isDark ? Palette.slate[700] : '#FFFFFF' }]}
            onPress={() => setActiveTab('company')}
          >
            <Building2 size={16} color={activeTab === 'company' ? Palette.primary : isDark ? Palette.slate[400] : Palette.slate[500]} />
            <Text style={[styles.segmentText, { color: activeTab === 'company' ? Palette.primary : isDark ? Palette.slate[400] : Palette.slate[500] }]}>Profil</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.segmentBtn, activeTab === 'catalog' && styles.segmentBtnActive, activeTab === 'catalog' && { backgroundColor: isDark ? Palette.slate[700] : '#FFFFFF' }]}
            onPress={() => setActiveTab('catalog')}
          >
            <BookOpen size={16} color={activeTab === 'catalog' ? Palette.primary : isDark ? Palette.slate[400] : Palette.slate[500]} />
            <Text style={[styles.segmentText, { color: activeTab === 'catalog' ? Palette.primary : isDark ? Palette.slate[400] : Palette.slate[500] }]}>Catalogue</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.segmentBtn, activeTab === 'preferences' && styles.segmentBtnActive, activeTab === 'preferences' && { backgroundColor: isDark ? Palette.slate[700] : '#FFFFFF' }]}
            onPress={() => setActiveTab('preferences')}
          >
            <SettingsIcon size={16} color={activeTab === 'preferences' ? Palette.primary : isDark ? Palette.slate[400] : Palette.slate[500]} />
            <Text style={[styles.segmentText, { color: activeTab === 'preferences' ? Palette.primary : isDark ? Palette.slate[400] : Palette.slate[500] }]}>Apparence</Text>
          </Pressable>
        </View>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={40}
      >
        
        {/* --- ONGLET ENTREPRISE --- */}
        {activeTab === 'company' && (
          <View>
            <View style={[styles.iconHeader, { backgroundColor: Palette.primary + '15' }]}>
              <Building2 size={32} color={Palette.primary} />
            </View>
            <Text style={[styles.heading, { color: isDark ? Palette.slate[50] : Palette.slate[900] }]}>
              Informations Entreprise
            </Text>
            <Text style={[styles.subheading, { color: isDark ? Palette.slate[400] : Palette.slate[500] }]}>
              Ces informations apparaîtront sur vos devis et factures.
            </Text>

            <View style={styles.form}>
              <View style={[styles.logoContainer, { backgroundColor: isDark ? Palette.slate[800] : '#FFFFFF', borderColor: isDark ? Palette.slate[700] : Palette.slate[200] }]}>
                <Text style={[labelStyle, { alignSelf: 'flex-start', marginBottom: 12 }]}>Logo de l'entreprise</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, width: '100%' }}>
                  <Pressable onPress={() => setShowLogoPreview(true)}>
                    {form.logoBase64 ? (
                      <Image source={{ uri: form.logoBase64 }} style={[styles.logoImage, { borderColor: isDark ? Palette.slate[700] : Palette.slate[200] }]} />
                    ) : (
                    <Image source={isDark ? require('@/assets/logo-dark.png') : require('@/assets/logo-light.png')} style={[styles.logoImage, { borderColor: isDark ? Palette.slate[700] : Palette.slate[200], backgroundColor: '#FFF' }]} resizeMode="contain" />
                    )}
                  </Pressable>
                  <View style={{ flex: 1, gap: 10 }}>
                    <Pressable onPress={pickImage} style={[styles.logoBtn, { backgroundColor: Palette.primary + '15' }]}>
                      <Text style={[styles.logoBtnText, { color: Palette.primary }]}>
                        {form.logoBase64 ? 'Changer le logo' : 'Sélectionner un logo'}
                      </Text>
                    </Pressable>
                    {form.logoBase64 ? (
                      <Pressable onPress={() => setForm({ ...form, logoBase64: '' })} style={[styles.logoBtn, { backgroundColor: Palette.danger + '10' }]}>
                        <Text style={[styles.logoBtnText, { color: Palette.danger }]}>Supprimer</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={labelStyle}>Nom complet</Text>
                <TextInput style={inputStyle} value={form.companyName} onChangeText={(v) => setForm({ ...form, companyName: v })} placeholder="AD Services" placeholderTextColor={Palette.slate[400]} />
              </View>
              <View style={styles.field}>
                <Text style={labelStyle}>SIRET</Text>
                <TextInput style={inputStyle} value={form.siret} onChangeText={(v) => setForm({ ...form, siret: v })} placeholder="123 456 789 00012" placeholderTextColor={Palette.slate[400]} keyboardType="number-pad" />
              </View>
              <View style={styles.field}>
                <Text style={labelStyle}>Adresse</Text>
                <TextInput style={[...inputStyle, styles.multiline]} value={form.address} onChangeText={(v) => setForm({ ...form, address: v })} placeholder="12 Rue de la Paix, 75001 Paris" placeholderTextColor={Palette.slate[400]} multiline />
              </View>
              <View style={styles.field}>
                <Text style={labelStyle}>Email</Text>
                <TextInput style={inputStyle} value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} placeholder="contact@adservices.fr" placeholderTextColor={Palette.slate[400]} keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={styles.field}>
                <Text style={labelStyle}>Téléphone</Text>
                <TextInput style={inputStyle} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} placeholder="06 12 34 56 78" placeholderTextColor={Palette.slate[400]} keyboardType="phone-pad" />
              </View>
              <View style={styles.field}>
                <Text style={labelStyle}>Site web</Text>
                <TextInput style={inputStyle} value={form.website} onChangeText={(v) => setForm({ ...form, website: v })} placeholder="www.adservices.fr" placeholderTextColor={Palette.slate[400]} autoCapitalize="none" />
              </View>
              <View style={styles.field}>
                <Text style={labelStyle}>Notes par défaut (pied de page)</Text>
                <TextInput style={[...inputStyle, styles.multiline]} value={form.defaultNotes} onChangeText={(v) => setForm({ ...form, defaultNotes: v })} placeholder="Conditions de paiement, mentions légales..." placeholderTextColor={Palette.slate[400]} multiline />
              </View>
            </View>

            <Pressable
              onPress={handleSaveCompany}
              style={({ pressed }) => [styles.saveBtn, { backgroundColor: Palette.primary, opacity: pressed ? 0.85 : 1 }]}
            >
              <Save size={18} color="#FFF" />
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            </Pressable>
          </View>
        )}

        {/* --- ONGLET CATALOGUE --- */}
        {activeTab === 'catalog' && (
          <View>
            <View style={[styles.iconHeader, { backgroundColor: Palette.primary + '15' }]}>
              <BookOpen size={32} color={Palette.primary} />
            </View>
            <Text style={[styles.heading, { color: isDark ? Palette.slate[50] : Palette.slate[900] }]}>
              Prestations
            </Text>
            <Text style={[styles.subheading, { color: isDark ? Palette.slate[400] : Palette.slate[500] }]}>
              Gérez vos services pour les ajouter rapidement à vos devis.
            </Text>

            {catalogItems.length === 0 ? (
              <View style={[styles.emptyCard, { borderColor: isDark ? Palette.slate[700] : Palette.slate[200] }]}>
                <View style={styles.emptyIconBg}>
                  <Layers size={40} color={Palette.primaryLight} />
                </View>
                <Text style={[styles.emptyTitle, { color: isDark ? Palette.slate[50] : Palette.slate[900] }]}>Votre catalogue est vide</Text>
                <Text style={[styles.emptyDesc, { color: isDark ? Palette.slate[400] : Palette.slate[500] }]}>
                  Ajoutez vos prestations fréquentes pour les réutiliser facilement dans vos devis et factures.
                </Text>
                <Pressable
                  style={[styles.emptyBtn, { backgroundColor: Palette.primary }]}
                  onPress={() => {
                    setEditingCat(null);
                    setCatForm({ title: '', description: '', defaultPrice: '0' });
                    setShowCatModal(true);
                  }}
                >
                  <Plus size={18} color="#FFF" />
                  <Text style={styles.emptyBtnText}>Créer ma première prestation</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.catList}>
                {catalogItems.map((item, i) => (
                  <Swipeable
                    key={item.id}
                    renderRightActions={() => (
                      <View style={styles.swipeActions}>
                        <Pressable 
                          style={[styles.swipeBtn, { backgroundColor: Palette.secondary }]}
                          onPress={() => {
                            setEditingCat(item);
                            setCatForm({ title: item.title, description: item.description || '', defaultPrice: String(item.defaultPrice || 0) });
                            setShowCatModal(true);
                          }}
                        >
                          <Edit2 size={20} color="#FFF" />
                        </Pressable>
                        <Pressable 
                          style={[styles.swipeBtn, { backgroundColor: Palette.danger, borderTopRightRadius: 16, borderBottomRightRadius: 16 }]}
                          onPress={() => handleDeleteCatalogItem(item.id)}
                        >
                          <Trash2 size={20} color="#FFF" />
                        </Pressable>
                      </View>
                    )}
                  >
                    <View style={[styles.catItem, { backgroundColor: isDark ? Palette.slate[800] : '#FFF', borderColor: isDark ? Palette.slate[700] : Palette.slate[200] }]}>
                      <View style={[styles.catIconContainer, { backgroundColor: Palette.primary + '15' }]}>
                        <Tag size={20} color={Palette.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.catTitle, { color: isDark ? Palette.slate[50] : Palette.slate[900] }]}>{item.title}</Text>
                        {item.description ? <Text style={[styles.catDesc, { color: isDark ? Palette.slate[400] : Palette.slate[500] }]} numberOfLines={2}>{item.description}</Text> : null}
                      </View>
                      <Text style={[styles.catPrice, { color: Palette.primary }]}>{item.defaultPrice?.toFixed(2) ?? '0.00'} €</Text>
                    </View>
                  </Swipeable>
                ))}
              </View>
            )}
          </View>
        )}

        {/* --- ONGLET PREFERENCES --- */}
        {activeTab === 'preferences' && (
          <View>
            <View style={[styles.iconHeader, { backgroundColor: Palette.primary + '15' }]}>
              <SettingsIcon size={32} color={Palette.primary} />
            </View>
            <Text style={[styles.heading, { color: isDark ? Palette.slate[50] : Palette.slate[900] }]}>
              Apparence
            </Text>
            <Text style={[styles.subheading, { color: isDark ? Palette.slate[400] : Palette.slate[500] }]}>
              Personnalisez le thème de l'application.
            </Text>

            <View style={styles.themeOptions}>
              <Pressable
                onPress={() => setThemePref('system')}
                style={[styles.themeBtn, themePref === 'system' && { borderColor: Palette.primary, backgroundColor: isDark ? Palette.slate[800] : Palette.slate[100] }]}
              >
                <Smartphone size={24} color={themePref === 'system' ? Palette.primary : isDark ? Palette.slate[400] : Palette.slate[500]} />
                <Text style={[styles.themeBtnText, { color: themePref === 'system' ? Palette.primary : isDark ? Palette.slate[400] : Palette.slate[500] }]}>Système</Text>
              </Pressable>

              <Pressable
                onPress={() => setThemePref('light')}
                style={[styles.themeBtn, themePref === 'light' && { borderColor: Palette.primary, backgroundColor: isDark ? Palette.slate[800] : Palette.slate[100] }]}
              >
                <Sun size={24} color={themePref === 'light' ? Palette.primary : isDark ? Palette.slate[400] : Palette.slate[500]} />
                <Text style={[styles.themeBtnText, { color: themePref === 'light' ? Palette.primary : isDark ? Palette.slate[400] : Palette.slate[500] }]}>Clair</Text>
              </Pressable>

              <Pressable
                onPress={() => setThemePref('dark')}
                style={[styles.themeBtn, themePref === 'dark' && { borderColor: Palette.primary, backgroundColor: isDark ? Palette.slate[800] : Palette.slate[100] }]}
              >
                <Moon size={24} color={themePref === 'dark' ? Palette.primary : isDark ? Palette.slate[400] : Palette.slate[500]} />
                <Text style={[styles.themeBtnText, { color: themePref === 'dark' ? Palette.primary : isDark ? Palette.slate[400] : Palette.slate[500] }]}>Sombre</Text>
              </Pressable>
            </View>

            <View style={{ height: 40 }} />
            
            <Text style={[styles.heading, { color: isDark ? Palette.slate[50] : Palette.slate[900], marginBottom: 8 }]}>
              Sauvegarde & Données
            </Text>
            <Text style={[styles.subheading, { color: isDark ? Palette.slate[400] : Palette.slate[500], marginBottom: 24 }]}>
              Exportez votre base de données locale pour ne pas perdre vos informations (clients, devis, factures).
            </Text>
            
            <Pressable
              onPress={exportDatabase}
              style={[styles.saveBtn, { backgroundColor: isDark ? Palette.slate[800] : Palette.slate[100], shadowOpacity: 0, marginTop: 0 }]}
            >
              <Database size={18} color={Palette.primary} />
              <Text style={[styles.saveBtnText, { color: Palette.primary }]}>Exporter la base de données (.db)</Text>
            </Pressable>

          </View>
        )}

        <View style={{ height: 60 }} />
      </KeyboardAwareScrollView>
    </View>

    {activeTab === 'catalog' && (
      <FAB
        icon={<Plus size={24} color="#FFF" />}
        onPress={() => {
          setEditingCat(null);
          setCatForm({ title: '', description: '', defaultPrice: '0' });
          setShowCatModal(true);
        }}
      />
    )}

    {/* Modal Catalogue (Bottom Sheet) */}
    <Modal visible={showCatModal} transparent animationType="fade" onRequestClose={() => setShowCatModal(false)}>
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowCatModal(false)} />
        <View style={[styles.modalContent, { backgroundColor: isDark ? Palette.slate[800] : '#FFF', borderColor: isDark ? Palette.slate[700] : Palette.slate[200], borderBottomWidth: 0 }]}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: isDark ? Palette.slate[50] : Palette.slate[900] }]}>
              {editingCat ? 'Modifier la prestation' : 'Nouvelle prestation'}
            </Text>
            <Pressable onPress={() => setShowCatModal(false)}>
              <X size={24} color={isDark ? Palette.slate[400] : Palette.slate[500]} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={labelStyle}>Nom de la prestation *</Text>
              <View style={[styles.inputWrapper, { borderColor: isDark ? Palette.slate[600] : Palette.slate[300] }]}>
                <Tag size={18} color={Palette.slate[400]} />
                <TextInput style={styles.inputIcon} value={catForm.title} onChangeText={(v) => setCatForm({ ...catForm, title: v })} placeholder="Ex: Déplacement" placeholderTextColor={Palette.slate[400]} />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={labelStyle}>Description (optionnelle)</Text>
              <View style={[styles.inputWrapper, { borderColor: isDark ? Palette.slate[600] : Palette.slate[300], alignItems: 'flex-start', paddingTop: 12 }]}>
                <AlignLeft size={18} color={Palette.slate[400]} style={{ marginTop: 2 }} />
                <TextInput style={[styles.inputIcon, styles.multiline, { minHeight: 60, paddingVertical: 0 }]} value={catForm.description} onChangeText={(v) => setCatForm({ ...catForm, description: v })} placeholder="Détails de la prestation..." placeholderTextColor={Palette.slate[400]} multiline />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={labelStyle}>Prix unitaire par défaut</Text>
              <View style={[styles.inputWrapper, { borderColor: isDark ? Palette.slate[600] : Palette.slate[300] }]}>
                <Euro size={18} color={Palette.slate[400]} />
                <TextInput style={styles.inputIcon} value={catForm.defaultPrice} onChangeText={(v) => setCatForm({ ...catForm, defaultPrice: v })} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={Palette.slate[400]} />
              </View>
            </View>
          </View>

          <Pressable
            onPress={handleSaveCatalogItem}
            style={({ pressed }) => [styles.saveBtn, { backgroundColor: Palette.primary, opacity: pressed ? 0.85 : 1, marginTop: 20 }]}
          >
            <Text style={styles.saveBtnText}>Sauvegarder</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    {/* Modal Logo Preview */}
    <Modal visible={showLogoPreview} transparent animationType="fade" onRequestClose={() => setShowLogoPreview(false)}>
      <View style={styles.previewOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowLogoPreview(false)} />
        <Pressable style={styles.previewCloseBtn} onPress={() => setShowLogoPreview(false)}>
          <X size={28} color="#FFF" />
        </Pressable>
        {form.logoBase64 ? (
          <Image source={{ uri: form.logoBase64 }} style={styles.previewImage} resizeMode="contain" />
        ) : (
          <Image source={isDark ? require('@/assets/logo-dark.png') : require('@/assets/logo-light.png')} style={[styles.previewImage, { backgroundColor: '#FFF', borderRadius: 20 }]} resizeMode="contain" />
        )}
      </View>
    </Modal>

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
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabsWrapper: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  segmentedControl: { flexDirection: 'row', padding: 4, borderRadius: 14 },
  segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  segmentBtnActive: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  segmentText: { fontSize: 13, fontWeight: '700' },
  content: { padding: 20 },
  iconHeader: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  heading: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  subheading: { fontSize: 13, textAlign: 'center', marginBottom: 28, lineHeight: 18 },
  form: { gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  multiline: { minHeight: 70, textAlignVertical: 'top' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, marginTop: 28, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  logoContainer: { padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 8, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 8, elevation: 1 },
  logoImage: { width: 80, height: 80, borderRadius: 16, borderWidth: 1 },
  logoPlaceholder: { width: 80, height: 80, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  logoBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center' },
  logoBtnText: { fontWeight: '700', fontSize: 13 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  emptyCard: { padding: 32, borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.01)' },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: Palette.primary + '10', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  emptyDesc: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12 },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  catList: { gap: 12 },
  catItem: { flexDirection: 'row', padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
  catIconContainer: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  catTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  catDesc: { fontSize: 13, marginBottom: 8 },
  catPrice: { fontSize: 16, fontWeight: '800' },
  swipeActions: { flexDirection: 'row', alignItems: 'stretch' },
  swipeBtn: { width: 64, alignItems: 'center', justifyContent: 'center', marginLeft: 8, borderRadius: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 1000 },
  modalContent: { width: '100%', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, borderWidth: 1, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CCC', alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, gap: 10, backgroundColor: 'transparent' },
  inputIcon: { flex: 1, paddingVertical: 14, fontSize: 15 },
  themeOptions: { flexDirection: 'row', gap: 12 },
  themeBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20, borderRadius: 16, borderWidth: 2, borderColor: 'transparent', gap: 8 },
  themeBtnText: { fontSize: 14, fontWeight: '700' },
  previewOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
  previewImage: { width: '90%', height: '70%' },
  previewCloseBtn: { position: 'absolute', top: 50, right: 20, zIndex: 2001, padding: 10 },
});
