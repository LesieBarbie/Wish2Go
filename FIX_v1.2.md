# 🔧 Фикс v1.2 — убираем reanimated

Ошибка `Exception in HostFunction: NativeWorklets` означает несовместимость версии reanimated с Expo Go на телефоне. Чтобы не возиться с версиями, я **убрал reanimated вообще** и переделал жесты на стандартном `react-native-gesture-handler` + встроенный React Native `Animated`. Работает почти так же плавно, но без проблем с плагинами и версиями.

---

## Что нужно сделать

### 1. Удали babel.config.js

Тот файл что я дал раньше с `react-native-reanimated/plugin` — **удали его**. В папке проекта:

Windows PowerShell:
```bash
del babel.config.js
```

Если `babel.config.js` был ДО того как ты создавал проект (из шаблона Expo) — оставь его, но убедись что в нём **нет строки** `'react-native-reanimated/plugin'`. Если есть — удали эту строку.

Идеально файла просто нет — Expo сам подставит дефолтный конфиг.

### 2. Удали reanimated из проекта

```bash
npm uninstall react-native-reanimated
```

### 3. Замени 2 файла

Скачай новый архив и замени:
- `App.js`
- `src/components/WorldMapSvg.js`

Остальные файлы не трогай.

### 4. Полный сброс кэша и перезапуск

```bash
rmdir /s /q node_modules\.cache
rmdir /s /q .expo
npx expo start --tunnel --clear
```

**И обязательно** полностью закрой Expo Go на телефоне (смахни из списка недавних приложений), открой заново, сканируй QR.

---

## Что должно заработать

- Карта мира загружается без ошибок
- Палец — пан, двумя пальцами — зум (pinch)
- Двойной тап — быстрый зум/сброс
- Кнопка ⊙ справа сверху — сброс

---

## Если всё ещё ошибка

Скинь:
1. Вывод `npm list react-native-reanimated` (должно быть `(empty)` после uninstall)
2. Содержимое `babel.config.js` если он есть
3. Новый текст ошибки
