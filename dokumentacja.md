# Kalendarz szkolny

Aplikacja internetowa do przeglądania szkolnych wydarzeń. Użytkownicy mogą sprawdzać kalendarz i drukować go wraz z legendą. Administratorzy mogą dodatkowo dodawać wydarzenia.

## Wymagania

- Node.js i npm
- Projekt w Supabase z skonfigurowanym uwierzytelnianiem i bazą danych

## Uruchomienie lokalne

1. Zainstaluj zależności:

   ```bash
   npm i

2.Utwórz plik .env w katalogu głównym projektu i uzupełnij dane projektu Supabase:

VITE_SUPABASE_URL=https://adres-projektu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=klucz-publiczny

Nie umieszczaj w aplikacji klucza service_role ani innych kluczy prywatnych.

3.Uruchom aplikację w trybie deweloperskim:
npm run dev

Vite wyświetli adres lokalnej aplikacji w terminalu.


Funkcje
Użytkownik
Logowanie przez e-mail i hasło.
Odzyskiwanie hasła przez e-mail.
Przeglądanie wydarzeń w układzie miesięcznym.
Przechodzenie między miesiącami oraz wybór miesiąca i roku.
Przeglądanie szczegółów wydarzeń dla wybranego dnia.
Drukowanie kalendarza razem z legendą; można też zapisać go do PDF w oknie drukowania przeglądarki.
Administrator
Korzysta z tego samego kalendarza co użytkownik.
Może dodawać wydarzenia jedno- i wielodniowe.
Może określić kategorię, datę, godzinę rozpoczęcia oraz opcjonalny opis.
Może oznaczyć wydarzenie jednodniowe jako całodniowe.
Kategorie i lata szkolne konfiguruje się w bazie Supabase — aplikacja nie udostępnia do tego osobnych formularzy administracyjnych.

Baza danych Supabase
Aplikacja korzysta z następujących tabel:

profiles — profil użytkownika; pole role określa rolę. Wartość admin otwiera widok administratora, a pozostałe wartości prowadzą do widoku użytkownika.
school_years — lata szkolne; używane pola to id, name, start_date, end_date i is_active.
categories — kategorie wydarzeń; używane pola to id, name, color i description.
events — wydarzenia powiązane z rokiem szkolnym i kategorią. Aplikacja używa m.in. pól title, description, start_date, end_date, start_time, end_time, category_id i school_year_id.
Relacja między wydarzeniem a kategorią powinna umożliwiać pobranie kategorii wraz z wydarzeniem. Schemat oraz polityki dostępu należy skonfigurować w Supabase — aplikacja sama nie tworzy tabel ani uprawnień.

Role i uprawnienia
Aplikacja odczytuje rolę użytkownika z tabeli profiles po zalogowaniu. Gdy nie można pobrać roli, wyświetlany jest widok użytkownika, a nie administratora.

Dostęp do odczytu i zapisu należy zabezpieczyć politykami RLS w Supabase. Samo ukrycie formularza w interfejsie nie zastępuje kontroli dostępu po stronie bazy danych.

Drukowanie
Wybierz Drukuj obok informacji o roku szkolnym. Wydruk jest przygotowany w orientacji poziomej A4 i zawiera kalendarz oraz kolory kategorii w legendzie. W ustawieniach drukowania przeglądarki włącz drukowanie tła, aby zachować kolory wydarzeń.

Główne elementy projektu
src/main.jsx — punkt startowy aplikacji React.
src/App.jsx — obsługa sesji, pobieranie roli i wybór widoku.
src/Login/ — ekran logowania i odzyskiwania hasła.
src/Kalendarz/ — kalendarz, formularz dodawania wydarzeń oraz style ekranu i wydruku.
src/Admin/ — widok administratora oparty na wspólnym komponencie kalendarza.
src/supabaseClient.js — konfiguracja klienta Supabase.
src/index.css — globalne style aplikacji.
Aplikacja jest zbudowana przy użyciu React, Vite i biblioteki @supabase/supabase-js.
