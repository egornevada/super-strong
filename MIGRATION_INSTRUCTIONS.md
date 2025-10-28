# 🚀 Инструкции по миграции данных на Production сервер

**Домен:** https://strong.webtga.ru/

---

## Файлы для миграции

В этой папке находятся 3 файла для автоматической миграции данных с локального Directus на production:

1. **export-categories.json** - 8 категорий упражнений
2. **export-exercises.json** - 16 упражнений со связями к категориям
3. **import-data.sh** - bash скрипт для импорта

---

## Пошаговые команды на сервере

### Шаг 1: Загрузить файлы в директорию `/root/directus/`

Используй Termius или SCP, чтобы загрузить 3 файла:
```bash
scp export-categories.json export-exercises.json import-data.sh root@strong.webtga.ru:/root/directus/
```

---

### Шаг 2: Сделать скрипт исполняемым

```bash
ssh root@strong.webtga.ru
chmod +x /root/directus/import-data.sh
```

---

### Шаг 3: Запустить импорт данных

```bash
cd /root/directus
./import-data.sh https://strong.webtga.ru admin@strong.webtga.ru ПАРОЛЬ_АДМИНА
```

**Замени `ПАРОЛЬ_АДМИНА`** на реальный пароль из переменной `DIRECTUS_ADMIN_PASSWORD` в `.env` на сервере.

**Пример:**
```bash
./import-data.sh https://strong.webtga.ru admin@strong.webtga.ru MySecurePass123
```

---

### Шаг 4: Проверить результат

```bash
# Проверить категории (должно быть 8)
curl -s https://strong.webtga.ru/api/items/categories | jq '.data | length'

# Проверить упражнения (должно быть 16)
curl -s https://strong.webtga.ru/api/items/exercises | jq '.data | length'
```

---

## Что импортируется

### 8 категорий:
- Бицепс (id: 19)
- Грудь (id: 20)
- Бедра (id: 21)
- Плечи (id: 22)
- Пресс (id: 23)
- Разгибатели спины (id: 24)
- Трапеции (id: 25)
- Трицепс (id: 27)

### 16 упражнений:
1. Подъём гантелей на бицепс сидя → Бицепс
2. Подъём на бицепс на нижнем блоке стоя → Бицепс
3. Подъём штанги на бицепс → Бицепс
4. Жим гантелей лёжа → Грудь
5. Жим гантелей на наклонной скамье → Грудь
6. Гакк-приседания → Бедра
7. Армейский жим сидя → Плечи
8. Тяга штанги к подбородку в тренажёре Смита → Плечи
9. Подъём ног с пола → Пресс
10. Скручивания на блочном тренажёре → Пресс
11. Гиперэкстензия → Разгибатели спины
12. Шраги с гантелями → Трапеции
13. Шраги со штангой → Трапеции
14. Разгибания рук со штангой стоя или сидя → Трицепс
15. Французский жим → Трицепс
16. Французский жим на наклонной скамье → Трицепс

---

## Как работает скрипт

1. ✅ Аутентифицируется на Directus admin панели с помощью email и пароля
2. ✅ Получает access token из API
3. ✅ Импортирует все 8 категорий через POST запрос
4. ✅ Импортирует все 16 упражнений через POST запрос
5. ✅ Показывает количество импортированных элементов

---

## Если возникли ошибки

### "Authentication failed"
- Проверь пароль админа (DIRECTUS_ADMIN_PASSWORD из .env)
- Убедись что Directus запущен и доступен по домену

### "jq: command not found"
```bash
apt-get update && apt-get install -y jq
```

### "Permission denied"
```bash
chmod +x /root/directus/import-data.sh
```

### "No such file or directory"
- Убедись что все 3 файла загружены в `/root/directus/`
- Проверь: `ls -la /root/directus/`

---

## После успешной миграции

Проверь в админ панели:
```
https://strong.webtga.ru/api/admin
Email: admin@strong.webtga.ru
Password: ТВОЙ_ПАРОЛЬ
```

Там должны быть видны все 8 категорий и 16 упражнений.

---

**Готово!** Передай эти инструкции другому Claude и он сможет выполнить команды на сервере. 🚀
