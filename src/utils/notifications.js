import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Налаштування поведінки сповіщень коли додаток активний
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Запитує дозвіл на системні сповіщення у користувача.
 * Викликаємо один раз при старті додатку.
 */
export async function requestNotificationPermissions() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // На Android потрібно створити канал сповіщень
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('achievements', {
        name: 'Досягнення',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#69e36a',
      });
    }

    return finalStatus === 'granted';
  } catch (e) {
    console.warn('Notification permission error:', e);
    return false;
  }
}

/**
 * Надсилає локальне системне сповіщення про отриману ачівку.
 */
export async function sendAchievementNotification(achievement) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🏆 Нове досягнення!`,
        body: `${achievement.icon} ${achievement.title} — ${achievement.description}`,
        data: { achievementId: achievement.id },
        sound: true,
      },
      trigger: null, // миттєво
    });
  } catch (e) {
    console.warn('Failed to send notification:', e);
  }
}
