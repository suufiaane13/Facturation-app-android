import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Simple check to see if we are running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Request permissions for push notifications
 */
export async function registerForPushNotificationsAsync() {
  if (isExpoGo) {
    console.warn("Notifications are not supported in Expo Go (SDK 53+). Use a development build to test.");
    return null;
  }

  const Notifications = require('expo-notifications');
  
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return finalStatus;
}

/**
 * Schedule a reminder for an unpaid invoice
 */
export async function scheduleInvoiceReminder(docNumber: string, clientName: string, dueDate: Date) {
  if (isExpoGo) return null;

  const Notifications = require('expo-notifications');
  const isQuote = docNumber.startsWith('DEV');
  const trigger = new Date(dueDate);
  const now = new Date();
  
  if (trigger <= now) {
    trigger.setDate(now.getDate() + 1);
    trigger.setHours(10, 0, 0, 0);
  } else {
    trigger.setHours(10, 0, 0, 0);
  }

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: isQuote ? "📈 Suivi Devis" : "⌛ Rappel d'impayé",
      body: isQuote 
        ? `N'oubliez pas de relancer ${clientName} pour le devis ${docNumber}.`
        : `La facture ${docNumber} pour ${clientName} est arrivée à échéance.`,
      data: { docNumber, screen: 'documents' },
    },
    trigger,
  });
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  if (isExpoGo) return;
  const Notifications = require('expo-notifications');
  await Notifications.cancelAllScheduledNotificationsAsync();
}
