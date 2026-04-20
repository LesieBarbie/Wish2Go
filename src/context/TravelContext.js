import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { loadMeta, saveMeta, META_KEYS, loadData, saveData, KEYS } from '../utils/storage';
import { sendAchievementNotification } from '../utils/notifications';
import { ACHIEVEMENTS } from '../data/achievements';
import CountryRepository from '../repositories/CountryRepository';
import AchievementRepository from '../repositories/AchievementRepository';

/**
 * TravelContext тепер використовує Repository-шар замість прямого AsyncStorage.
 *
 * Архітектура:
 *   UI → TravelContext → Repository → { Storage + API }
 *
 * Для збереження сумісності з існуючими екранами, контекст продовжує виставляти
 * масиви `visited` і `dream`, але всередині працює з екземплярами моделі Country
 * через CountryRepository.
 */

const TravelContext = createContext(null);

// Створюємо єдині екземпляри репозиторіїв на весь життєвий цикл застосунку
const countryRepo = new CountryRepository();
const achievementRepo = new AchievementRepository();

export function TravelProvider({ children }) {
  const [visited, setVisited] = useState([]);
  const [dream, setDream] = useState([]);
  const [regions, setRegions] = useState({});
  const [loaded, setLoaded] = useState(false);

  const [notifiedAchievements, setNotifiedAchievements] = useState([]);
  const [pendingToast, setPendingToast] = useState(null);
  const toastQueue = useRef([]);

  // --- Завантаження при старті через репозиторій (Offline-first) ---
  useEffect(() => {
    (async () => {
      // 1. Мігруємо старі дані, якщо вони ще існують у старому форматі
      await migrateLegacyData();

      // 2. Читаємо з нового сховища через репозиторій
      const allCountries = await countryRepo.getAll();

      // Паралельно тягнемо з сервера (offline-first сценарій)
      countryRepo.getAllWithBackgroundSync((remoteCountries) => {
        // Коли сервер відповість — оновимо стан
        const v = remoteCountries.filter((c) => c.visited).map(toLegacy);
        const d = remoteCountries.filter((c) => c.isDream).map(toLegacy);
        setVisited(v);
        setDream(d);
      }).catch(() => {});

      const v = allCountries.filter((c) => c.visited).map(toLegacy);
      const d = allCountries.filter((c) => c.isDream).map(toLegacy);
      setVisited(v);
      setDream(d);

      const r = await loadData(KEYS.REGIONS, {}); // regions - прості дані, без API
      const n = await loadMeta(META_KEYS.NOTIFIED_ACHIEVEMENTS, []);
      setRegions(r);
      setNotifiedAchievements(n);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) saveData(KEYS.REGIONS, regions); }, [regions, loaded]);
  useEffect(() => {
    if (loaded) saveMeta(META_KEYS.NOTIFIED_ACHIEVEMENTS, notifiedAchievements);
  }, [notifiedAchievements, loaded]);

  // --- Відстеження нових ачівок ---
  useEffect(() => {
    if (!loaded) return;
    const unlocked = ACHIEVEMENTS.filter((a) => a.check(visited, dream));
    const newOnes = unlocked.filter((a) => !notifiedAchievements.includes(a.id));

    if (newOnes.length > 0) {
      newOnes.forEach((a) => {
        sendAchievementNotification(a);
        // Зберігаємо у репозиторій ачівок (локально + API)
        achievementRepo.save({
          id: a.id,
          title: a.title,
          description: a.description,
          icon: a.icon,
          requiredCount: 0,
          unlocked: true,
          unlockedAt: new Date(),
        }).catch(() => {});
      });
      toastQueue.current.push(...newOnes);
      if (!pendingToast) setPendingToast(toastQueue.current.shift());
      setNotifiedAchievements((prev) => [...prev, ...newOnes.map((a) => a.id)]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visited, dream, loaded]);

  const hideToast = () => {
    if (toastQueue.current.length > 0) setPendingToast(toastQueue.current.shift());
    else setPendingToast(null);
  };

  // --- Дії з країнами через репозиторій ---
  const toggleVisited = async (id, name) => {
    const existing = await countryRepo.getById(id);
    if (existing && existing.visited) {
      await countryRepo.delete(id);
      setVisited((list) => list.filter((c) => c.id !== id));
      return;
    }
    // Забираємо з мрій, якщо було там
    setDream((list) => list.filter((c) => c.id !== id));

    const meta = existing || {};
    const country = {
      id,
      name,
      continent: meta.continent || '',
      visited: true,
      isDream: false,
      dateVisited: new Date(),
      note: '',
      syncStatus: 'pending',
    };
    await countryRepo.save(country);
    setVisited((list) => [
      ...list,
      { id, name, note: '', date: country.dateVisited.toISOString() },
    ]);
  };

  const toggleDream = async (id, name) => {
    const existing = await countryRepo.getById(id);
    if (existing && existing.isDream) {
      await countryRepo.delete(id);
      setDream((list) => list.filter((c) => c.id !== id));
      return;
    }
    setVisited((list) => list.filter((c) => c.id !== id));

    const country = {
      id,
      name,
      continent: existing?.continent || '',
      visited: false,
      isDream: true,
      dateVisited: null,
      note: '',
      syncStatus: 'pending',
    };
    await countryRepo.save(country);
    setDream((list) => [...list, { id, name, note: '' }]);
  };

  const updateNote = async (listType, id, note) => {
    if (listType === 'visited') {
      setVisited((list) => list.map((c) => (c.id === id ? { ...c, note } : c)));
    } else {
      setDream((list) => list.map((c) => (c.id === id ? { ...c, note } : c)));
    }
    const existing = await countryRepo.getById(id);
    if (existing) {
      existing.note = note;
      existing.syncStatus = 'pending';
      await countryRepo.save(existing);
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

  const resetAll = async () => {
    // Видаляємо всі записи через репозиторій
    const all = await countryRepo.getAll();
    for (const c of all) {
      await countryRepo.delete(c.id);
    }
    setVisited([]);
    setDream([]);
    setRegions({});
    setNotifiedAchievements([]);
    toastQueue.current = [];
    setPendingToast(null);
  };

  /**
   * Ручна синхронізація усіх pending-записів з сервером.
   * Викликається з ProfileScreen кнопкою "Синхронізувати зараз".
   */
  const syncPending = async () => {
    return countryRepo.syncPending();
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
        syncPending,
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

// Допоміжна функція: конвертація моделі Country → legacy-формат для UI
function toLegacy(country) {
  return {
    id: country.id,
    name: country.name,
    note: country.note || '',
    ...(country.visited && country.dateVisited
      ? { date: country.dateVisited.toISOString() }
      : {}),
  };
}

/**
 * Міграція старих даних (з попередніх версій застосунку, де дані
 * зберігалися у форматі visited_countries / dream_countries)
 * у нову колекцію через репозиторій.
 *
 * Запускається один раз — якщо нова колекція порожня, але є старі дані.
 */
async function migrateLegacyData() {
  try {
    const existing = await countryRepo.getAll();
    if (existing.length > 0) return; // Вже мігровано

    const oldVisited = await loadData(KEYS.VISITED, []);
    const oldDream = await loadData(KEYS.DREAM, []);

    for (const v of oldVisited) {
      await countryRepo.save({
        id: v.id,
        name: v.name,
        continent: '',
        visited: true,
        isDream: false,
        dateVisited: v.date ? new Date(v.date) : new Date(),
        note: v.note || '',
        syncStatus: 'synced', // старі дані вважаємо вже синхронізованими
      });
    }
    for (const d of oldDream) {
      const alreadyVisited = oldVisited.some((v) => v.id === d.id);
      if (alreadyVisited) continue;
      await countryRepo.save({
        id: d.id,
        name: d.name,
        continent: '',
        visited: false,
        isDream: true,
        dateVisited: null,
        note: d.note || '',
        syncStatus: 'synced',
      });
    }
  } catch (e) {
    console.warn('Migration failed (non-critical):', e.message);
  }
}
