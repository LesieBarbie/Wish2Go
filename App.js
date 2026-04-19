import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { TravelProvider, useTravel } from './src/context/TravelContext';
import MapScreen from './src/screens/MapScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import CountryDetailScreen from './src/screens/CountryDetailScreen';
import AchievementToast from './src/components/AchievementToast';
import { requestNotificationPermissions } from './src/utils/notifications';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MapStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MapMain" component={MapScreen} />
      <Stack.Screen
        name="CountryDetail"
        component={CountryDetailScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params?.name || 'Країна',
          headerBackTitle: 'Назад',
        })}
      />
    </Stack.Navigator>
  );
}

function tabIcon(emoji) {
  return () => <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}

/**
 * Обгортка над основним UI, щоб мати доступ до context
 * для показу toast-сповіщень поверх всього.
 */
function AppContent() {
  const { pendingToast, hideToast } = useTravel();

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#2e7d32',
            tabBarLabelStyle: { fontSize: 12 },
          }}
        >
          <Tab.Screen
            name="Map"
            component={MapStack}
            options={{ title: 'Мапа', tabBarIcon: tabIcon('🗺️') }}
          />
          <Tab.Screen
            name="Achievements"
            component={AchievementsScreen}
            options={{ title: 'Досягнення', tabBarIcon: tabIcon('🏆') }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: 'Профіль', tabBarIcon: tabIcon('👤') }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      <AchievementToast achievement={pendingToast} onHide={hideToast} />
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  // Запитуємо дозвіл на сповіщення один раз при старті
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TravelProvider>
        <AppContent />
      </TravelProvider>
    </GestureHandlerRootView>
  );
}
