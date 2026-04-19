import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { loadData, saveData, KEYS } from '../utils/storage';
import { sendAchievementNotification } from '../utils/notifications';
import { ACHIEVEMENTS } from '../data/achievements';

const TravelContext = createContext(null);

export function TravelProvider({ children }) {
  const [visited, setVisited] = useState([]);
  const [dream, setDream] = useState([]);
  const [regions, setRegions] = useState({});
  const [loaded, setLoaded] = useState(false);

  // ID ачівок, про які ми вже сповістили користувача
  // (зберігаємо окремо, щоб не спамити сповіщеннями при кожному перезапуску)
  const [notifiedAchievements, setNotifiedAchievements] = useState([]);

  // Поточна toast-ачівка для показу в UI
  const [pendingToast, setPendingToast] = useState(null);

  // Черга toast'ів, якщо одразу розблоковано кілька ачівок
  const toastQueue = useRef([]);

  // --- Завантаження при старті ---
  useEffect(() => {
    (async () => {
      const v = await loadData(KEYS.VISITED, []);
      const d = await loadData(KEYS.DREAM, []);
      const r = await loadData(KEYS.REGIONS, {});
      const n = await loadData('notified_achievements', []);
      setVisited(v);
      setDream(d);
      setRegions(r);
      setNotifiedAchievements(n);
      setLoaded(true);
    })();
  }, []);

  // --- Збереження при змінах ---
  useEffect(() => { if (loaded) saveData(KEYS.VISITED, visited); }, [visited, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.DREAM, dream); }, [dream, loaded]);
  useEffect(() => { if (loaded) saveData(KEYS.REGIONS, regions); }, [regions, loaded]);
  useEffect(() => {
    if (loaded) saveData('notified_achievements', notifiedAchievements);
  }, [notifiedAchievements, loaded]);

  // --- Відстеження нових ачівок ---
  useEffect(() => {
    if (!loaded) return;

    // Знаходимо всі розблоковані ачівки
    const unlocked = ACHIEVEMENTS.filter((a) => a.check(visited, dream));
    // Нові — ті, про які ще не сповіщали
    const newOnes = unlocked.filter((a) => !notifiedAchievements.includes(a.id));

    if (newOnes.length > 0) {
      // Надсилаємо системні сповіщення
      newOnes.forEach((a) => sendAchievementNotification(a));

      // Додаємо в чергу toast'ів
      toastQueue.current.push(...newOnes);

      // Якщо жоден toast зараз не показується — показуємо перший
      if (!pendingToast) {
        setPendingToast(toastQueue.current.shift());
      }

      // Позначаємо як сповіщені
      setNotifiedAchievements((prev) => [...prev, ...newOnes.map((a) => a.id)]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visited, dream, loaded]);

  // Коли toast ховається — показуємо наступний з черги
  const hideToast = () => {
    if (toastQueue.current.length > 0) {
      setPendingToast(toastQueue.current.shift());
    } else {
      setPendingToast(null);
    }
  };

  // --- Дії з країнами ---
  const toggleVisited = (id, name) => {
    setVisited((list) => {
      const exists = list.find((c) => c.id === id);
      if (exists) return list.filter((c) => c.id !== id);
      setDream((d) => d.filter((c) => c.id !== id));
      return [...list, { id, name, note: '', date: new Date().toISOString() }];
    });
  };

  const toggleDream = (id, name) => {
    setDream((list) => {
      const exists = list.find((c) => c.id === id);
      if (exists) return list.filter((c) => c.id !== id);
      setVisited((v) => v.filter((c) => c.id !== id));
      return [...list, { id, name, note: '' }];
    });
  };

  const updateNote = (listType, id, note) => {
    if (listType === 'visited') {
      setVisited((list) => list.map((c) => (c.id === id ? { ...c, note } : c)));
    } else {
      setDream((list) => list.map((c) => (c.id === id ? { ...c, note } : c)));
    }
  };

  const toggleRegion = (countryId, regionName) => {
    setRegions((prev) => {
      const current = prev[countryId] || [];
      const exists = current.includes(regionName);
      const next = exists
        ? current.filter((r) => r !== regionName)
        : [...current, regionName];
      return { ...prev, [countryId]: next };
    });
  };

  const resetAll = () => {
    setVisited([]);
    setDream([]);
    setRegions({});
    setNotifiedAchievements([]);
    toastQueue.current = [];
    setPendingToast(null);
  };

  return (
    <TravelContext.Provider
      value={{
        visited,
        dream,
        regions,
        loaded,
        toggleVisited,
        toggleDream,
        updateNote,
        toggleRegion,
        resetAll,
        pendingToast,
        hideToast,
      }}
    >
      {children}
    </TravelContext.Provider>
  );
}

export function useTravel() {
  const ctx = useContext(TravelContext);
  if (!ctx) throw new Error('useTravel must be used inside TravelProvider');
  return ctx;
}
