import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Image, KeyboardAvoidingView, Platform, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Building2, Check, ChevronRight, Rocket, ShieldCheck, Zap, Camera, X } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { db } from '@/db/client';
import { companySettings } from '@/db/schema';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (step === 0) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 20, friction: 7, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [step]);

  const [form, setForm] = useState({
    companyName: '',
    siret: '',
    address: '',
    email: '',
    phone: '',
    logoBase64: '',
  });

  const updateForm = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const base64Data = result.assets[0].base64 
        ? `data:image/jpeg;base64,${result.assets[0].base64}` 
        : '';
      setForm(prev => ({ 
        ...prev, 
        logoBase64: base64Data || result.assets[0].uri 
      }));
    }
  };

  const handleFinish = async () => {
    try {
      // Clear any existing settings to avoid duplicates
      await db.delete(companySettings);

      // Save new settings to DB
      await db.insert(companySettings).values({
        companyName: form.companyName,
        siret: form.siret,
        address: form.address,
        email: form.email,
        phone: form.phone,
        logoBase64: form.logoBase64,
      });

      // Mark onboarding as finished
      await AsyncStorage.setItem('hasFinishedOnboarding', 'true');
      router.replace('/(tabs)');
    } catch (e) {
      console.error(e);
    }
  };

  const bgColor = isDark ? Palette.slate[900] : '#FFFFFF';
  const textColor = isDark ? Palette.slate[50] : Palette.slate[900];
  const mutedText = isDark ? Palette.slate[400] : Palette.slate[500];

  const NavButton = () => (
    <View style={styles.navContainer}>
      {step < steps.length - 1 ? (
        <Pressable 
          style={[styles.nextBtn, { backgroundColor: Palette.primary }]} 
          onPress={() => setStep(step + 1)}
        >
          <Text style={styles.nextBtnText}>Continuer</Text>
          <ChevronRight size={20} color="#FFF" />
        </Pressable>
      ) : (
        <Pressable 
          style={[styles.finishBtn, { backgroundColor: Palette.success }]} 
          onPress={handleFinish}
        >
          <Text style={styles.nextBtnText}>Commencer à Facturer</Text>
          <Check size={20} color="#FFF" />
        </Pressable>
      )}
    </View>
  );

  const renderStep0 = () => (
    <View style={styles.step}>
      <Animated.View style={[styles.proHeroContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.proHeroCircle, { backgroundColor: 'transparent' }]}>
          <Image 
            source={require('../assets/logo-padded.png')} 
            style={{ width: 140, height: 140, resizeMode: 'contain' }} 
          />
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <Text style={[styles.welcomeTitle, { color: textColor }]}>AD Services Professional</Text>
        <Text style={[styles.welcomeSub, { color: mutedText }]}>
          L'excellence opérationnelle pour votre gestion documentaire et financière.
        </Text>
        
        <View style={styles.features}>
          <FeatureItem icon={<Zap size={20} color={Palette.primary} />} text="Documents créés en moins de 2 min" isDark={isDark} />
          <FeatureItem icon={<ShieldCheck size={20} color={Palette.success} />} text="Conforme aux normes auto-entrepreneur" isDark={isDark} />
          <FeatureItem icon={<Rocket size={20} color="#6366F1" />} text="Envoi direct par Email & WhatsApp" isDark={isDark} />
        </View>
      </Animated.View>
      <NavButton />
    </View>
  );

  const renderStep1 = () => (
    <KeyboardAwareScrollView 
      style={styles.step} 
      contentContainerStyle={{ paddingBottom: 40 }} 
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      extraScrollHeight={50}
    >
      <Text style={[styles.stepTitle, { color: textColor }]}>Votre Entreprise</Text>
      <Text style={[styles.stepSub, { color: mutedText }]}>Ces informations apparaîtront sur vos PDF.</Text>

      <Pressable onPress={pickImage} style={[styles.logoPicker, { borderColor: Palette.primary, backgroundColor: isDark ? Palette.slate[800] : Palette.slate[50] }]}>
        {form.logoBase64 ? (
          <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <Image source={{ uri: form.logoBase64 }} style={styles.logoPreview} />
            <View style={styles.logoOverlay}><Camera size={20} color="#FFF" /></View>
          </View>
        ) : (
          <View style={{ alignItems: 'center', justifyContent: 'center', padding: 10 }}>
            <Building2 size={32} color={Palette.primary} />
            <Text style={{ color: Palette.primary, fontWeight: '700', marginTop: 8, textAlign: 'center', fontSize: 13 }}>
              Ajouter votre logo
            </Text>
          </View>
        )}
      </Pressable>

      <InputLabel label="Nom de l'entreprise" isDark={isDark} />
      <TextInput 
        style={[styles.input, { color: textColor, borderColor: isDark ? Palette.slate[700] : Palette.slate[200] }]} 
        value={form.companyName} 
        onChangeText={(v) => updateForm('companyName', v)}
        placeholder="Ex: AD Services"
        placeholderTextColor={mutedText}
      />

      <InputLabel label="Numéro SIRET" isDark={isDark} />
      <TextInput 
        style={[styles.input, { color: textColor, borderColor: isDark ? Palette.slate[700] : Palette.slate[200] }]} 
        value={form.siret} 
        onChangeText={(v) => updateForm('siret', v)}
        placeholder="14 chiffres"
        placeholderTextColor={mutedText}
        keyboardType="numeric"
      />

      <InputLabel label="Adresse complète" isDark={isDark} />
      <TextInput 
        style={[styles.input, { color: textColor, borderColor: isDark ? Palette.slate[700] : Palette.slate[200] }]} 
        value={form.address} 
        onChangeText={(v) => updateForm('address', v)}
        placeholder="Rue, Code Postal, Ville"
        placeholderTextColor={mutedText}
        multiline
      />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <InputLabel label="Email" isDark={isDark} />
          <TextInput 
            style={[styles.input, { color: textColor, borderColor: isDark ? Palette.slate[700] : Palette.slate[200] }]} 
            value={form.email} 
            onChangeText={(v) => updateForm('email', v)}
            placeholder="contact@..."
            placeholderTextColor={mutedText}
            keyboardType="email-address"
          />
        </View>
        <View style={{ flex: 1 }}>
          <InputLabel label="Téléphone" isDark={isDark} />
          <TextInput 
            style={[styles.input, { color: textColor, borderColor: isDark ? Palette.slate[700] : Palette.slate[200] }]} 
            value={form.phone} 
            onChangeText={(v) => updateForm('phone', v)}
            placeholder="06..."
            placeholderTextColor={mutedText}
            keyboardType="phone-pad"
          />
        </View>
      </View>
      <NavButton />
    </KeyboardAwareScrollView>
  );

  const renderStep2 = () => (
    <View style={styles.step}>
      <Text style={[styles.stepTitle, { color: textColor }]}>Guide de démarrage</Text>
      <Text style={[styles.stepSub, { color: mutedText }]}>3 astuces pour être plus productif.</Text>

      <View style={styles.guideContainer}>
        <GuideCard 
          number="1" 
          title="Créez en un clin d'oeil" 
          desc="Utilisez le bouton '+' du menu pour lancer un devis ou une facture." 
          isDark={isDark} 
        />
        <GuideCard 
          number="2" 
          title="Catalogue de Services" 
          desc="Enregistrez vos prestations répétitives pour les ajouter en 1 clic." 
          isDark={isDark} 
        />
        <GuideCard 
          number="3" 
          title="Partage Direct" 
          desc="Générez le PDF et envoyez-le par Email ou WhatsApp instantanément." 
          isDark={isDark} 
        />
      </View>

      <View style={styles.finalNote}>
        <Check size={18} color={Palette.success} />
        <Text style={{ color: Palette.success, fontWeight: '600', marginLeft: 8 }}>Tout est prêt !</Text>
      </View>
      <NavButton />
    </View>
  );

  const steps = [renderStep0, renderStep1, renderStep2];

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.progressContainer}>
            {steps.map((_, i) => (
              <View 
                key={i} 
                style={[
                  styles.progressBar, 
                  { backgroundColor: i <= step ? Palette.primary : isDark ? Palette.slate[800] : Palette.slate[200] }
                ]} 
              />
            ))}
          </View>
        </View>

        <View style={{ flex: 1 }}>
          {steps[step]()}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function FeatureItem({ icon, text, isDark }: { icon: any, text: string, isDark: boolean }) {
  return (
    <View style={[styles.featureItem, { backgroundColor: isDark ? Palette.slate[800] : Palette.slate[50] }]}>
      {icon}
      <Text style={[styles.featureText, { color: isDark ? Palette.slate[200] : Palette.slate[700] }]}>{text}</Text>
    </View>
  );
}

function InputLabel({ label, isDark }: { label: string, isDark: boolean }) {
  return <Text style={[styles.inputLabel, { color: isDark ? Palette.slate[400] : Palette.slate[600] }]}>{label}</Text>;
}

function GuideCard({ number, title, desc, isDark }: { number: string, title: string, desc: string, isDark: boolean }) {
  return (
    <View style={[styles.guideCard, { backgroundColor: isDark ? Palette.slate[800] : Palette.slate[50] }]}>
      <View style={[styles.guideNumber, { backgroundColor: Palette.primary }]}>
        <Text style={{ color: '#FFF', fontWeight: '800' }}>{number}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.guideTitle, { color: isDark ? Palette.slate[50] : Palette.slate[900] }]}>{title}</Text>
        <Text style={[styles.guideDesc, { color: isDark ? Palette.slate[400] : Palette.slate[500] }]}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 20 },
  progressContainer: { flexDirection: 'row', gap: 8 },
  progressBar: { flex: 1, height: 4, borderRadius: 2 },
  step: { flex: 1, paddingHorizontal: 24 },
  proHeroContainer: { alignItems: 'center', marginVertical: 40 },
  proHeroCircle: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  proHeroBadge: { position: 'absolute', bottom: 5, right: 5, backgroundColor: Palette.success, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFF' },
  welcomeTitle: { fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  welcomeSub: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20, marginBottom: 32 },
  features: { gap: 12 },
  featureItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 12 },
  featureText: { fontSize: 14, fontWeight: '600' },
  stepTitle: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  stepSub: { fontSize: 14, marginBottom: 24 },
  logoPicker: { width: 120, height: 120, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 24, alignSelf: 'center', overflow: 'hidden' },
  logoPreview: { width: '100%', height: '100%', resizeMode: 'contain' },
  logoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
  guideContainer: { gap: 16, marginTop: 10 },
  guideCard: { flexDirection: 'row', padding: 16, borderRadius: 18, gap: 16, alignItems: 'center' },
  guideNumber: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  guideTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  guideDesc: { fontSize: 13, lineHeight: 18 },
  finalNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  footer: { padding: 24, paddingBottom: 40 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 20, gap: 8, shadowColor: Palette.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  finishBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 20, gap: 8, shadowColor: Palette.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  nextBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  navContainer: { marginTop: 24, marginBottom: 20 },
});
