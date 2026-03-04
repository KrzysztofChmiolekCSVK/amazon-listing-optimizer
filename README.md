# 📦 Optymalizator Listingów Amazon

Narzędzie do tworzenia zoptymalizowanych listingów Amazon na rynki europejskie (DE, FR, IT, ES, NL, SE, PL).

## Funkcje

- **Generator AI (Groq)** — darmowy model Llama 3.3 70B generuje pełne listingi w języku docelowego marketplace'u
- **Browse Tree Guide** — wbudowany parser BTG Home & Kitchen z automatycznym podpowiadaniem atrybutów
- **Edytor ręczny** — ręczna edycja z licznikami znaków/bajtów i walidacją limitów Amazona
- **Ocena jakości** — scoring tytułu, bullet pointów i backend keywords w czasie rzeczywistym
- **Wielojęzyczność** — listingi generowane natywnie w języku marketplace'u (nie tłumaczone)

## Szybki start — wdrożenie na Vercel (5 minut)

### 1. Utwórz repozytorium na GitHub

```bash
cd amazon-listing-optimizer
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TWOJA-FIRMA/amazon-listing-optimizer.git
git push -u origin main
```

### 2. Wdrożenie na Vercel

1. Wejdź na [vercel.com](https://vercel.com) i zaloguj się kontem GitHub
2. Kliknij **"Add New Project"**
3. Zaimportuj repozytorium `amazon-listing-optimizer`
4. Kliknij **"Deploy"** — gotowe!

Otrzymasz link typu `amazon-listing-optimizer.vercel.app` — wyślij go zespołowi.

### 3. Klucz API Groq (darmowy)

1. Wejdź na [console.groq.com/keys](https://console.groq.com/keys)
2. Załóż darmowe konto
3. Wygeneruj klucz API
4. Wklej klucz w ustawieniach aplikacji (zakładka ⚙️)

**Klucz jest przechowywany wyłącznie w przeglądarce użytkownika** — nie jest wysyłany na żaden serwer poza Groq.

Możesz też wygenerować jeden klucz i przekazać go zespołowi — darmowy tier Groq pozwala na ~30 zapytań/minutę.

## Darmowe limity Groq

| Model | Limit zapytań/min | Limit tokenów/min |
|-------|-------------------|--------------------|
| Llama 3.3 70B | 30 | 6,000 |
| Llama 3.1 8B | 30 | 6,000 |
| Mixtral 8x7B | 30 | 5,000 |

Dla typowego zespołu (5-10 osób) darmowy tier w zupełności wystarczy.

## Struktura projektu

```
amazon-listing-optimizer/
├── public/
│   └── btg-data.json        # Dane Browse Tree Guide (Home & Kitchen)
├── src/
│   ├── main.jsx              # Entry point
│   └── App.jsx               # Główna aplikacja
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── README.md
```

## Aktualizacja danych BTG

Jeśli chcesz zaktualizować dane kategorii:
1. Pobierz nowy BTG z Seller Central
2. Użyj tego samego procesu parsowania (skontaktuj się z autorem lub użyj skryptu)
3. Zastąp plik `public/btg-data.json`
4. Push na GitHub — Vercel automatycznie wdroży nową wersję

## Technologie

- **React 18** + **Vite** — frontend
- **Groq API** — darmowy dostęp do modeli LLM (Llama 3.3, Mixtral)
- **Vercel** — darmowy hosting z automatycznym CI/CD
