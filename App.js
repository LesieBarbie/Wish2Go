import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, LogBox, AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TravelProvider, useTravel } from './src/context/TravelContext';

import MapScreen from './src/screens/MapScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import CountryDetailScreen from './src/screens/CountryDetailScreen';
import CountriesListScreen from './src/screens/CountriesListScreen';
import RegionDetailScreen from './src/screens/RegionDetailScreen';
import LockScreen from './src/screens/LockScreen';
import SecuritySettingsScreen from './src/screens/SecuritySettingsScreen';
import LiveFeedScreen from './src/screens/LiveFeedScreen';

import AchievementToast from './src/components/AchievementToast';
import { requestNotificationPermissions } from './src/utils/notifications';
import { biometricManager } from './src/utils/BiometricManager';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'Each child in a list should have a unique "key" prop',
]);

const Tab = createBottomTabNavigator();
const MapStackNav = createNativeStackNavigator();
const ListStackNav = createNativeStackNavigator();

function MapStack() {
  return (
    <MapStackNav.Navigator screenOptions={{ headerShown: false }}>
      <MapStackNav.Screen name="MapMain" component={MapScreen} />
      <MapStackNav.Screen
        name="CountryDetail"
        component={CountryDetailScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params?.name || 'Країна',
          headerBackTitle: 'Назад',
        })}
      />
      <MapStackNav.Screen
        name="RegionDetail"
        component={RegionDetailScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params?.regionName || 'Регіон',
          headerBackTitle: 'Назад',
        })}
      />
    </MapStackNav.Navigator>
  );
}

function ListStack() {
  return (
    <ListStackNav.Navigator screenOptions={{ headerShown: false }}>
      <ListStackNav.Screen name="CountriesList" component={CountriesListScreen} />
      <ListStackNav.Screen
        name="CountryDetail"
        component={CountryDetailScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params?.name || 'Країна',
          headerBackTitle: 'Назад',
        })}
      />
      <ListStackNav.Screen
        name="RegionDetail"
        component={RegionDetailScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route.params?.regionName || 'Регіон',
          headerBackTitle: 'Назад',
        })}
      />
    </ListStackNav.Navigator>
  );
}

function tabIcon(emoji) {
  return () => <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}

function AppContent() {
  const { pendingToast, hideToast } = useTravel();
  const [locked, setLocked] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const appState = useRef(AppState.currentState);
  const bgTimer = useRef(null);

  useEffect(() => {
    (async () => {
      const enabled = await biometricManager.isEnabledByUser();
      setBiometricEnabled(enabled);
      if (!enabled) setLocked(false);
    })();

    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        bgTimer.current = Date.now();
      }
      if (next === 'active' && bgTimer.current) {
        const secs = (Date.now() - bgTimer.current) / 1000;
        if (secs > 30) {
          biometricManager.isEnabledByUser().then(en => {
            if (en) setLocked(true);
          });
        }
        bgTimer.current = null;
      }
      appState.current = next;
    });

    return () => sub.remove();
  }, []);

  if (locked && biometricEnabled) {
    return <LockScreen onUnlock={() => setLocked(false)} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#2e7d32',
            tabBarLabelStyle: { fontSize: 11 },
          }}
        >
          <Tab.Screen
            name="Map"
            component={MapStack}
            options={{ title: 'Мапа', tabBarIcon: tabIcon('🗺️') }}
          />
          <Tab.Screen
            name="List"
            component={ListStack}
            options={{ title: 'Список', tabBarIcon: tabIcon('📋') }}
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
          <Tab.Screen
            name="Security"
            component={SecuritySettingsScreen}
            options={{ title: 'Безпека', tabBarIcon: tabIcon('🔒') }}
          />
          <Tab.Screen
            name="Live"
            component={LiveFeedScreen}
            options={{ title: 'Стрічка', tabBarIcon: tabIcon('📡') }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      <AchievementToast achievement={pendingToast} onHide={hideToast} />
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TravelProvider>
          <AppContent />
        </TravelProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}