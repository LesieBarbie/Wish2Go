/**
 * Модель Country (Країна).
 *
 * Сутність представляє одну країну у застосунку - як відвідану,
 * так і країну-мрію або ще не позначену. Зберігає основні дані
 * про країну та факт її відвідування конкретним користувачем.
 *
 * Поле syncStatus (offline-first):
 *  - 'pending' — зміна зроблена локально, ще не синхронізована з сервером
 *  - 'synced'  — повністю синхронізовано з сервером
 *  - 'error'   — синхронізація не вдалася, треба повторити пізніше
 */
export default class Country {
  /**
   * @param {string} id - ISO 3166-1 числовий код країни (наприклад "276" для Німеччини)
   * @param {string} name - назва країни українською
   * @param {string} continent - континент (Європа, Азія, Африка тощо)
   * @param {boolean} visited - чи відвідана користувачем
   * @param {boolean} isDream - чи додана до списку мрій
   * @param {Date|null} dateVisited - дата відвідування (null якщо не відвідана)
   * @param {string} note - особиста нотатка користувача про країну
   * @param {string} syncStatus - статус синхронізації: 'pending' | 'synced' | 'error'
   */
  constructor(
    id,
    name,
    continent,
    visited = false,
    isDream = false,
    dateVisited = null,
    note = '',
    syncStatus = 'pending'
  ) {
    this.id = id;                   // string
    this.name = name;               // string
    this.continent = continent;     // string
    this.visited = visited;         // boolean
    this.isDream = isDream;         // boolean
    this.dateVisited = dateVisited; // Date | null
    this.note = note;               // string
    this.syncStatus = syncStatus;   // string ('pending' | 'synced' | 'error')
  }

  /**
   * Створює екземпляр з plain-об'єкта (наприклад, зі збереженого JSON).
   */
  static fromJSON(obj) {
    return new Country(
      obj.id,
      obj.name,
      obj.continent || '',
      obj.visited ?? false,
      obj.isDream ?? false,
      obj.dateVisited ? new Date(obj.dateVisited) : null,
      obj.note || '',
      obj.syncStatus || 'pending'
    );
  }

  /**
   * Серіалізує для збереження в AsyncStorage.
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      continent: this.continent,
      visited: this.visited,
      isDream: this.isDream,
      dateVisited: this.dateVisited ? this.dateVisited.toISOString() : null,
      note: this.note,
      syncStatus: this.syncStatus,
    };
  }

  /**
   * Статус країни у вигляді рядка для відображення у UI.
   */
  getStatus() {
    if (this.visited) return '✅ Відвідано';
    if (this.isDream) return '💭 У мріях';
    return '⚪ Не позначено';
  }

  /**
   * Кількість днів з моменту відвідування.
   */
  getDaysSinceVisit() {
    if (!this.dateVisited) return null;
    const diffMs = Date.now() - this.dateVisited.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Позначити як синхронізовану з сервером.
   */
  markSynced() {
    this.syncStatus = 'synced';
  }

  /**
   * Позначити що синхронізація не вдалася.
   */
  markError() {
    this.syncStatus = 'error';
  }

  /**
   * Чи потребує запис синхронізації з сервером.
   */
  needsSync() {
    return this.syncStatus === 'pending' || this.syncStatus === 'error';
  }
}
