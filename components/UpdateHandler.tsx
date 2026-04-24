import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import * as Updates from 'expo-updates';
import { RefreshCw, X } from 'lucide-react-native';
import { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function UpdateHandler() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const isDark = useColorScheme() === 'dark';

  useEffect(() => {
    async function checkUpdates() {
      if (__DEV__) return; // On ne vérifie pas en mode développement
      
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          setUpdateAvailable(true);
          showBanner();
        }
      } catch (e) {
        console.log('Update check failed:', e);
      }
    }

    checkUpdates();
    
    // On vérifie toutes les 10 minutes si l'app reste ouverte longtemps
    const interval = setInterval(checkUpdates, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const showBanner = () => {
    Animated.spring(slideAnim, {
      toValue: 20,
      useNativeDriver: true,
      tension: 20,
      friction: 7,
    }).start();
  };

  const hideBanner = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setUpdateAvailable(false));
  };

  const onReload = async () => {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      hideBanner();
    }
  };

  if (!updateAvailable) return null;

  return (
    <Animated.View style={[
      styles.container, 
      { 
        transform: [{ translateY: slideAnim }],
        backgroundColor: isDark ? Palette.slate[800] : '#FFFFFF',
        shadowColor: '#000',
      }
    ]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: Palette.primary + '20' }]}>
          <RefreshCw size={20} color={Palette.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: isDark ? '#FFF' : Palette.slate[900] }]}>
            Mise à jour prête !
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? Palette.slate[400] : Palette.slate[500] }]}>
            Redémarrez pour appliquer les changements.
          </Text>
        </View>
        <Pressable onPress={onReload} style={[styles.button, { backgroundColor: Palette.primary }]}>
          <Text style={styles.buttonText}>Relancer</Text>
        </Pressable>
        <Pressable onPress={hideBanner} style={styles.closeBtn}>
          <X size={20} color={isDark ? Palette.slate[500] : Palette.slate[400]} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 16,
    padding: 12,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  }
});
