import Achievement from '../models/Achievement';
import * as storage from '../utils/storage';
import * as achievementsApi from '../api/achievementsApi';

/**
 * AchievementRepository — поєднує локальне сховище та API для досягнень.
 *
 * Стратегія: Offline-first (та сама, що й для країн).
 * Досягнення розблоковуються локально, потім синхронізуються з сервером.
 */
export default class AchievementRepository {
  constructor(storageModule = storage, apiModule = achievementsApi) {
    this.storage = storageModule;
    this.api = apiModule;
    this.collection = storage.COLLECTIONS.ACHIEVEMENTS;
  }

  // --- 4 локальні CRUD операції ---

  async getAll() {
    const raw = await this.storage.getList(this.collection);
    return raw.map((obj) => Achievement.fromJSON(obj));
  }

  async getById(id) {
    const obj = await this.storage.getItem(this.collection, id);
    return obj ? Achievement.fromJSON(obj) : null;
  }

  async save(achievement) {
    if (!(achievement instanceof Achievement)) {
      achievement = Achievement.fromJSON(achievement);
    }
    await this.storage.saveItem(this.collection, achievement.toJSON());
    // Фонова синхронізація
    this.api.postUnlockedAchievement(achievement).catch((e) =>
      console.warn('Achievement sync failed', achievement.id, e.message)
    );
    return achievement;
  }

  async delete(id) {
    return this.storage.deleteItem(this.collection, id);
  }
}
