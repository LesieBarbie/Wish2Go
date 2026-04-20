# 📚 Лабораторна №2 — відповідність критеріям

Цей документ показує, як кожна вимога лаби 2 реалізована в коді проекту.

---

## 1. Локальне сховище

### Вимога: 4 операції CRUD

Реалізовано у `src/utils/storage.js`:

| Операція | Функція | Опис |
|---|---|---|
| ЗБЕРЕГТИ | `saveItem(collection, item)` | Create/update одного об'єкта за id |
| ПРОЧИТАТИ СПИСОК | `getList(collection)` | Повертає масив усіх об'єктів колекції |
| ПРОЧИТАТИ ОДИН | `getItem(collection, id)` | Повертає один об'єкт за id (або null) |
| ВИДАЛИТИ | `deleteItem(collection, id)` | Видаляє об'єкт за id |

### Вимога: Дані зберігаються між перезапусками

✅ Використовується `AsyncStorage` — стандартне key-value сховище React Native, яке персистує на диск.

### Вимога: UI читає зі сховища (не з hardcoded масиву)

✅ `CountriesListScreen` та `CountryDetailScreen` беруть дані через `CountryRepository.getAll()` / `getById()`, які всередині звертаються до `AsyncStorage`.

### Обрана технологія

**AsyncStorage** (key-value). Обрано тому що:
- Дані застосунку прості (набір відмічених країн, профіль користувача)
- Немає потреби у складних запитах чи зв'язках між таблицями
- Legacy-сумісність з попередньою версією

---

## 2. API-контракт

### Ендпоінти (REST)

Базовий URL: `https://api.travelmap.example`

| Метод | Шлях | Що повертає | Тіло / параметри |
|---|---|---|---|
| GET | `/countries` | Масив усіх країн-довідника | — |
| GET | `/countries/:id` | Одна країна | `id` в path |
| GET | `/users/me/visited` | Список відвіданих країн | — (авторизація) |
| POST | `/users/me/visited` | Створений запис | body: `{ countryId, name, date, note }` |
| PUT | `/users/me/visited/:id` | Оновлений запис | body: `{ date, note }` |
| DELETE | `/users/me/visited/:id` | `{ success: true }` | — |
| GET | `/achievements` | Список можливих ачівок | — |
| GET | `/users/me/achievements` | Розблоковані ачівки | — |
| POST | `/users/me/achievements` | Створений запис | body: `{ achievementId, unlockedAt }` |
| GET | `/users/me` | Профіль | — |
| PUT | `/users/me` | Оновлений профіль | body: `UserProfile` |

**Разом 11 ендпоінтів** (вимога лаби — мінімум 3).

### API-шар у коді

Розташування: `src/api/`
- `client.js` — базовий HTTP-клієнт з імітацією мережевої затримки 500ms
- `countriesApi.js` — 5 функцій для роботи з країнами
- `achievementsApi.js` — 3 функції для ачівок
- `profileApi.js` — 2 функції для профілю

Усі функції повертають `Promise` і внутрішньо використовують `setTimeout`, що імітує реальну затримку мережі. При переключенні на справжній бекенд достатньо замінити тіло функції `request()` у `client.js` на реальний `fetch()`.

---

## 3. Стратегія комунікації — Offline-first

### Обґрунтування вибору

Застосунок призначений для **мандрівника**, який може:
- Літати в літаку без Wi-Fi і хотіти позначити країну одразу після приземлення
- Подорожувати по країнах з роумінгом і обмеженим інтернетом
- Переглядати свої відвідані країни без мережі

Для такого сценарію offline-first — єдиний адекватний вибір. Усі дії працюють миттєво, синхронізація — у фоні.

### Repository-клас

Реалізовано 3 репозиторії у `src/repositories/`:

1. **`CountryRepository`** — головний, містить повну логіку offline-first
2. **`AchievementRepository`** — зберігає розблоковані ачівки
3. **`UserProfileRepository`** — зберігає профіль

Кожен репозиторій:
- Приймає `storage` та `api` як окремі залежності у конструкторі
- Надає 4 CRUD операції: `getAll()`, `getById()`, `save()`, `delete()`
- Інкапсулює логіку offline-first

### Сценарій оновлення: локальне + API

Головний сценарій — у `CountryRepository.getAllWithBackgroundSync()`:

```javascript
async getAllWithBackgroundSync(onRemoteUpdate) {
  // 1. Одразу повертаємо локальне
  const local = await this.getAll();

  // 2. У фоні тягнемо з сервера
  this.api.fetchVisitedCountries()
    .then(async (remote) => {
      // При успіху — мерджимо і повідомляємо UI через колбек
      for (const remoteItem of remote) {
        const existing = await this.storage.getItem(this.collection, remoteItem.id);
        if (!existing) {
          await this.storage.saveItem(this.collection, {
            ...remoteItem,
            syncStatus: 'synced',
          });
        }
      }
      onRemoteUpdate?.(await this.getAll());
    })
    .catch((e) => {
      // При помилці — просто залишаємо локальні дані
    });

  return local; // не чекаємо на сервер
}
```

Цей метод викликається з `TravelContext` при старті застосунку.

### Поле `syncStatus`

Додано у модель `Country`:

```javascript
this.syncStatus = syncStatus; // 'pending' | 'synced' | 'error'
```

Значення:
- **`pending`** — зміна зроблена локально, ще не синхронізована
- **`synced`** — повністю синхронізовано з сервером
- **`error`** — спроба синхронізації не вдалася, потрібно повторити

У UI списку країн (`CountriesListScreen`) для кожного запису показується badge:
- ✓ зелений — synced
- ⏳ помаранчевий — pending
- ⚠ червоний — error

---

## 4. Зв'язок з UI

### Зміни одразу відображаються

✅ Весь стан тече через React Context (`TravelContext`), який підписаний на репозиторій. При `toggleVisited()`:
1. `countryRepo.save(...)` — зберігається локально
2. `setVisited(...)` — оновлюється state
3. React перемальовує усі компоненти, що використовують `useTravel()`

### Дані зберігаються після перезапуску

✅ При старті застосунку `TravelProvider` у `useEffect` викликає `countryRepo.getAll()`, який зчитує з `AsyncStorage` і відновлює стан.

### Демо-режим для перевірки offline-first

У `ProfileScreen` додано:
- Перемикач **«Вимкнути/Увімкнути мережу»** — симулює офлайн-режим
- Кнопка **«Синхронізувати зараз»** — вручну запускає синхронізацію усіх `pending` записів
- Текстова підказка, що пояснює стратегію offline-first

Можна вимкнути мережу, позначити кілька країн — побачити помаранчеві ⏳ значки. Потім увімкнути мережу, натиснути «Синхронізувати» — значки стануть зеленими ✓.

---

## Перевірка критеріїв

| Вимога | Статус | Де подивитись |
|---|---|---|
| 4 CRUD операції у сховищі | ✅ | `src/utils/storage.js` |
| Дані зберігаються між запусками | ✅ | `AsyncStorage` + міграція у `TravelContext` |
| UI читає зі сховища | ✅ | `CountriesListScreen`, `CountryDetailScreen` через Repository |
| Обрано технологію | ✅ | AsyncStorage (key-value) з обґрунтуванням |
| ≥ 3 API-ендпоінти | ✅ | 11 ендпоінтів у таблиці вище |
| API-шар у коді | ✅ | `src/api/` — client + 3 API-модулі |
| Моки з затримкою | ✅ | `setTimeout(500ms)` у `client.js` |
| Обрано стратегію (зафіксовано) | ✅ | Offline-first, у цьому файлі та коментарях у коді |
| Repository-клас | ✅ | `src/repositories/` — 3 класи |
| Сценарій оновлення з API | ✅ | `CountryRepository.getAllWithBackgroundSync()` |
| Поле `syncStatus` | ✅ | `src/models/Country.js` |
| Додавання → одразу у списку | ✅ | Через Context + Repository |
| Видалення → одразу зникає | ✅ | Через Context + Repository |
| Дані збереглися після перезапуску | ✅ | `AsyncStorage` + `getAll()` при старті |

---

## Як продемонструвати викладачу

1. **Відкрити `src/utils/storage.js`** — показати 4 явні функції: `saveItem`, `getList`, `getItem`, `deleteItem`.
2. **Відкрити `src/api/countriesApi.js`** — показати коментар з таблицею REST-ендпоінтів і їх реалізацію-моки.
3. **Відкрити `src/repositories/CountryRepository.js`** — показати конструктор з залежностями (`storage`, `api`), метод `getAllWithBackgroundSync()` (це головний сценарій offline-first).
4. **Відкрити `src/models/Country.js`** — показати поле `syncStatus` і коментар про offline-first.
5. **Демо на телефоні:**
   - Зайти у Профіль → вимкнути мережу демо-кнопкою
   - Відзначити 2-3 країни — побачити помаранчеві ⏳ у списку
   - Увімкнути мережу — натиснути «Синхронізувати зараз» — значки стали зеленими ✓
   - Закрити застосунок і відкрити — дані на місці
