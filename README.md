# 🌍 Travel Wish Map — мобильное приложение

Мобильное приложение для отметки посещённых стран и стран мечты. Работает на iOS и Android через **Expo**.

---

## 📋 Что внутри (версия 1 — MVP)

- ✅ Карта мира — тапаешь на страну, отмечаешь как посещённую / мечту
- ✅ Прогресс-бар внизу: сколько % мира ты объездил, сколько Европы, Азии и т.д.
- ✅ Вкладка профиля со статистикой
- ✅ Вкладка ачивок (10 стран, 25 стран, вся Европа и т.д.)
- ✅ Расширенная карта для Германии / Швейцарии / США с регионами
- ✅ Всё сохраняется локально на телефоне (AsyncStorage)

**Что добавим во второй версии:**
- 📸 Фото для стран (через камеру телефона)
- 📝 Заметки и интересные факты
- 👥 Друзья и их прогресс (потребует Firebase — сделаем отдельно)

---

## 🛠 Часть 1. Установка среды (делается один раз)

### Шаг 1. Установи Node.js
Зайди на https://nodejs.org, скачай **LTS версию** (рекомендуемую). Установи.

Проверь в терминале (на Mac — Terminal, на Windows — PowerShell):
```bash
node --version
npm --version
```
Должны показаться номера версий.

### Шаг 2. Установи редактор кода
Скачай **VS Code**: https://code.visualstudio.com/ — бесплатный, лучший для React.

Полезные расширения в VS Code (открой Extensions, иконка кубиков слева):
- **ES7+ React/Redux/React-Native snippets**
- **Prettier** (форматирование кода)
- **React Native Tools**

### Шаг 3. Установи Expo Go на телефон
- **iPhone**: App Store → "Expo Go"
- **Android**: Google Play → "Expo Go"

Это приложение, через которое ты будешь видеть своё приложение в реальном времени, пока пишешь код.

---

## 🚀 Часть 2. Запуск проекта

### Шаг 1. Создай проект Expo

Открой терминал, перейди в папку где хочешь хранить проект (например Documents), и выполни:

```bash
npx create-expo-app@latest travel-app --template blank
cd travel-app
```

Это займёт 1-2 минуты. Будет создана папка `travel-app` с базовым приложением.

### Шаг 2. Установи библиотеки

В той же папке `travel-app` выполни:

```bash
npx expo install react-native-svg @react-native-async-storage/async-storage @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context react-native-gesture-handler d3-geo topojson-client
```

Это установит:
- `react-native-svg` — для рисования карты
- `async-storage` — хранение данных на телефоне
- `@react-navigation/*` — переключение между экранами (карта / профиль / ачивки)
- `d3-geo` + `topojson-client` — математика проекций карты

### Шаг 3. Скопируй мои файлы

Замени содержимое папки `travel-app` файлами которые я дал. Структура должна получиться такая:

```
travel-app/
├── App.js                          ← главный файл (замени)
├── src/
│   ├── screens/
│   │   ├── MapScreen.js
│   │   ├── ProfileScreen.js
│   │   ├── AchievementsScreen.js
│   │   └── CountryDetailScreen.js
│   ├── components/
│   │   ├── WorldMapSvg.js
│   │   ├── CountryRegionMap.js
│   │   └── ProgressBar.js
│   ├── context/
│   │   └── TravelContext.js
│   ├── data/
│   │   ├── countries.js
│   │   └── achievements.js
│   └── utils/
│       └── storage.js
└── package.json
```

### Шаг 4. Запусти

В папке `travel-app`:

```bash
npx expo start
```

В терминале появится QR-код.

- **iPhone**: открой камеру, наведи на QR — откроется в Expo Go
- **Android**: открой Expo Go → Scan QR Code → наведи

Приложение запустится на телефоне. **Когда ты меняешь код в VS Code и сохраняешь файл — приложение автоматически перезагружается на телефоне.** Это называется hot reload.

> **Важно:** телефон и компьютер должны быть в одной Wi-Fi сети.

---

## 🧭 Часть 3. Как учиться по ходу

1. **Меняй по одной вещи за раз.** Например, поменяй цвет отмеченных стран с зелёного на синий в `MapScreen.js` → сохрани → посмотри результат.
2. **Читай ошибки.** Если приложение сломалось — в терминале или на экране телефона будет красный экран с описанием ошибки. Скопируй её мне, я объясню.
3. **Console.log — твой друг.** Пиши `console.log('тут значение:', variable)` в коде — увидишь вывод в терминале где запущен `expo start`.

---

## 📚 Что изучать параллельно

- **Основы React Native** (2-3 часа): https://reactnative.dev/docs/tutorial
- **Официальный туториал Expo**: https://docs.expo.dev/tutorial/introduction/
- **React Navigation** (как сделаны вкладки): https://reactnavigation.org/docs/getting-started

---

## 🆘 Если что-то не работает

Пиши мне — покажи:
1. Текст ошибки из терминала
2. Что ты делал перед ошибкой
3. Скриншот экрана телефона если есть

Я помогу починить.
