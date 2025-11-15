# План реализации фичи "Отправка отчета о багах"

## Описание
Пользователь может отправить отчет о баге, нажав на логотип приложения два раза. При первом нажатии логотип меняется на "Logo Error". При втором нажатии открывается страница создания отчета. Если пользователь нажимает на другой элемент, логотип возвращается в нормальное состояние.

---

## 1️⃣ Backend (Supabase)

### Таблица `bug_reports`
```
Колонки:
- id (uuid, primary key)
- user_id (uuid, связь с таблицей users)
- telegram_username (text)
- browser_info (text)
- message (text)
- created_at (timestamp, auto-generated)
```

### RLS Policies
- Только авторизованные пользователи могут создавать отчеты
- Пользователи видят только свои отчеты

---

## 2️⃣ API функции

### В `src/services/supabaseApi.ts`
- [ ] Функция `createBugReport(data)` для сохранения отчета в таблицу `bug_reports`

### В `src/lib/browser.ts` (новый файл)
- [ ] Функция `getBrowserInfo()` для парсинга User-Agent браузера
  - Возвращает строку вида: "Chrome 131.0 / macOS"

---

## 3️⃣ UI компоненты

### `src/pages/BugReportPage.tsx` (новая страница)
Использует `PageLayout` с формой:
- **DefaultStroke:** Время (текущее время в формате HH:MM)
- **DefaultStroke:** Браузер (из `getBrowserInfo()`)
- **Текстовое поле:** Описание проблемы (многострочное, required)
- **Кнопка:** "Отправить отчет"

Функциональность:
- Функция `handleSubmitReport()`
  - Валидация текста (не пусто)
  - Loading state на кнопке
  - Отправка на сервер (`createBugReport()`)
  - При успехе: вызывает `onReportSubmitted()` из props
  - При ошибке: показывает ошибку

Props:
```typescript
interface BugReportPageProps {
  onClose?: () => void;
  onReportSubmitted?: () => void;
}
```

### `src/components/Snackbar.tsx` (новый компонент)
Универсальный компонент снекбара:
- Показывается внизу экрана
- Принимает сообщение через props
- Показывается 500ms и автоматически исчезает
- Можно использовать в других местах приложения

Props:
```typescript
interface SnackbarProps {
  message: string;
  duration?: number; // по умолчанию 500ms
  isVisible: boolean;
}
```

---

## 4️⃣ Логика двойного клика на логотип

### Обновить `src/components/Header.tsx`

Состояния:
- `isErrorLogoActive: boolean` - флаг, что логотип в режиме "Error"

Логика:
```
Начальное состояние: isErrorLogoActive = false (обычный логотип)

КЛИК НА ЛОГОТИП:
  - Если isErrorLogoActive === false:
    ✓ isErrorLogoActive = true
    ✓ Логотип меняется на "Logo Error"
  - Если isErrorLogoActive === true:
    ✓ Открыть страницу BugReportPage
    ✓ onOpenBugReport() из props

КЛИК НА ЛЮБОЙ ДРУГОЙ ЭЛЕМЕНТ (document):
  - isErrorLogoActive = false
  - Логотип вернулся в норму
```

Props для Header:
```typescript
interface HeaderProps {
  onOpenBugReport?: () => void; // функция для открытия страницы отчета
  rightSlot?: React.ReactNode;
}
```

---

## 5️⃣ State Management в `App.tsx`

Новые состояния:
```typescript
const [currentPage, setCurrentPage] = useState<PageType>('calendar' | 'exercises' | 'tracking' | 'daydetail' | 'bugreport');
const [showBugReportSnackbar, setShowBugReportSnackbar] = useState(false);
const [previousPage, setPreviousPage] = useState<PageType>('calendar'); // сохранять предыдущую страницу
```

Новые функции:
```typescript
const handleOpenBugReport = () => {
  setPreviousPage(currentPage);
  setCurrentPage('bugreport');
};

const handleCloseBugReport = () => {
  setCurrentPage(previousPage);
};

const handleBugReportSubmitted = () => {
  setShowBugReportSnackbar(true);
  setTimeout(() => {
    setShowBugReportSnackbar(false);
    setCurrentPage(previousPage);
  }, 500);
};
```

---

## 6️⃣ Интеграция в `App.tsx`

### В рендеринге Header:
```jsx
<Header
  onOpenBugReport={handleOpenBugReport}
  rightSlot={...}
/>
```

### Добавить страницу отчета (как остальные страницы):
```jsx
<div style={{ display: currentPage === 'bugreport' ? 'flex' : 'none' }} className="...">
  <BugReportPage
    onClose={handleCloseBugReport}
    onReportSubmitted={handleBugReportSubmitted}
  />
</div>
```

### Добавить Snackbar:
```jsx
<Snackbar
  message="Спасибо за отчет!"
  isVisible={showBugReportSnackbar}
  duration={500}
/>
```

---

## 📋 Файлы для создания/изменения

### Новые файлы:
- [ ] `src/lib/browser.ts`
- [ ] `src/pages/BugReportPage.tsx`
- [ ] `src/components/Snackbar.tsx`

### Изменяемые файлы:
- [ ] `src/App.tsx`
- [ ] `src/components/Header.tsx`
- [ ] `src/services/supabaseApi.ts`

### В Supabase:
- [ ] Создать таблицу `bug_reports`
- [ ] Добавить RLS policies

---

## 🚀 Порядок реализации

1. Создать таблицу в Supabase
2. Создать `src/lib/browser.ts` с функцией `getBrowserInfo()`
3. Создать `src/components/Snackbar.tsx`
4. Создать `src/pages/BugReportPage.tsx`
5. Обновить `src/services/supabaseApi.ts` функцией `createBugReport()`
6. Обновить `src/components/Header.tsx` с логикой двойного клика
7. Обновить `src/App.tsx` со state и рендерингом новой страницы
8. Тестирование

---

## 📝 Заметки

- Логотип "Logo Error" находится в `/Users/egornevada/Desktop/super-strong/src/assets/icons/Logo Error.svg`
- Используем `PageLayout` как и для других страниц (Profile, Settings)
- Снекбар универсальный, может использоваться в других местах в будущем
- Сообщение в снекбаре: "Спасибо за отчет!"
