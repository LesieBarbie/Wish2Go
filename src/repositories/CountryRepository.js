import Country from '../models/Country';
import * as storage from '../utils/storage';
import * as countriesApi from '../api/countriesApi';

/**
 * ============================================================
 * CountryRepository
 * ============================================================
 *
 * Реалізує патерн Repository: єдина точка доступу до даних про країни.
 * Приховує від бізнес-логіки те, звідки саме беруться дані — локальне
 * сховище чи сервер.
 *
 * СТРАТЕГІЯ: Offline-first
 * ------------------------
 * - UI завжди читає з локального сховища → миттєва відповідь, працює без інтернету.
 * - Зміни спочатку зберігаються локально з syncStatus='pending'.
 * - Паралельно запускаються фонові запити до API.
 * - При успіху сервера — оновлюємо локальний запис з syncStatus='synced'.
 * - При помилці — syncStatus='error', запис залишається у черзі на пізніше.
 *
 * Залежності:
 *  - storage: утиліти з 4 CRUD операціями (getList, getItem, saveItem, deleteItem)
 *  - api:     модуль мережевих викликів (countriesApi)
 */
export default class CountryRepository {
  constructor(storageModule = storage, apiModule = countriesApi) {
    this.storage = storageModule;
    this.api = apiModule;
    this.collection = storage.COLLECTIONS.COUNTRIES;
  }

  // ==========================================================
  // ЛОКАЛЬНІ 4 CRUD ОПЕРАЦІЇ (викликаються UI)
  // ==========================================================

  /** Прочитати список усіх позначених країн (відвідані + мрії). */
  async getAll() {
    const raw = await this.storage.getList(this.collection);
    return raw.map((obj) => Country.fromJSON(obj));
  }

  /** Прочитати одну країну за id. */
  async getById(id) {
    const obj = await this.storage.getItem(this.collection, id);
    return obj ? Country.fromJSON(obj) : null;
  }

  /** Зберегти одну країну (create або update). */
  async save(country) {
    if (!(country instanceof Country)) {
      country = Country.fromJSON(country);
    }
    await this.storage.saveItem(this.collection, country.toJSON());
    // Відразу запускаємо синхронізацію (не блокуємо UI)
    this.syncCountry(country).catch((e) =>
      console.warn('Background sync failed', country.id, e.message)
    );
    return country;
  }

  /** Видалити країну за id. */
  async delete(id) {
    const existed = await this.storage.deleteItem(this.collection, id);
    if (existed) {
      // Асинхронно повідомляємо сервер
      this.api.deleteVisitedCountry(id).catch((e) =>
        console.warn('Failed to delete on server', id, e.message)
      );
    }
    return existed;
  }

  // ==========================================================
  // СИНХРОНІЗАЦІЯ З API
  // ==========================================================

  /**
   * Синхронізувати один запис з сервером.
   * Викликається автоматично при save().
   */
  async syncCountry(country) {
    try {
      const response = country.visited
        ? await this.api.postVisitedCountry(country)
        : await this.api.putVisitedCountry(country.id, {
            date: country.dateVisited?.toISOString?.(),
            note: country.note,
          });

      // Сервер підтвердив → оновлюємо syncStatus локально
      const updated = await this.getById(country.id);
      if (updated) {
        updated.markSynced();
        await this.storage.saveItem(this.collection, updated.toJSON());
      }
      return response;
    } catch (e) {
      // Помилка → позначаємо як error, запис залишається локально
      const failed = await this.getById(country.id);
      if (failed) {
        failed.markError();
        await this.storage.saveItem(this.collection, failed.toJSON());
      }
      throw e;
    }
  }

  /**
   * Головний сценарій Offline-first:
   * повернути локальні дані одразу, а потім оновити їх з сервера у фоні.
   *
   * @param {function} onRemoteUpdate - колбек, який викликається коли дані з сервера
   *   прийшли. UI може підписатися і оновити стан.
   */
  async getAllWithBackgroundSync(onRemoteUpdate) {
    // 1. Одразу повертаємо локальне
    const local = await this.getAll();

    // 2. У фоні тягнемо з сервера і мержимо
    this.api.fetchVisitedCountries()
      .then(async (remote) => {
        // Для простоти: якщо сервер повернув більше записів - додаємо їх локально
        // (у реальному житті тут була б складніша логіка merge)
        if (Array.isArray(remote) && remote.length > 0) {
          for (const remoteItem of remote) {
            const existing = await this.storage.getItem(this.collection, remoteItem.id);
            if (!existing) {
              await this.storage.saveItem(this.collection, {
                ...remoteItem,
                syncStatus: 'synced',
              });
            }
          }
          const updated = await this.getAll();
          onRemoteUpdate?.(updated);
        }
      })
      .catch((e) => {
        console.warn('Background fetch failed:', e.message);
        // Нічого не робимо - працюємо з локальних даних
      });

    return local;
  }

  /**
   * Синхронізувати всі 'pending' / 'error' записи з сервером.
   * Викликається при появі мережі.
   */
  async syncPending() {
    const all = await this.getAll();
    const pending = all.filter((c) => c.needsSync());

    const results = { synced: 0, failed: 0 };
    for (const c of pending) {
      try {
        await this.syncCountry(c);
        results.synced++;
      } catch {
        results.failed++;
      }
    }
    return results;
  }
}
