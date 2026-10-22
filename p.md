<img width="1412" height="910" alt="Zrzut ekranu 2026-10-15 110534" src="https://github.com/user-attachments/assets/647d5f46-418d-4df1-ba8c-86c68565ae6e" />



<img width="1425" height="938" alt="image" src="https://github.com/user-attachments/assets/3ef4551d-6e2c-42bf-8039-37e129850ac3" />





1. Cel projektu
Responsywna aplikacja internetowa do przeglądania i zarządzania kalendarzem roku szkolnego. Umożliwia prezentowanie wydarzeń szkolnych oraz ich obsługę przez panel administratora.

2. Technologie
React + Vite – frontend aplikacji.

JavaScript – logika aplikacji.

CSS – wygląd i responsywność.

Supabase – baza danych PostgreSQL, logowanie i kontrola dostępu.

Git + GitHub – kontrola wersji i przechowywanie kodu.

3. Główne części aplikacji
Kalendarz publiczny:

Wyświetlanie bieżącego miesiąca

Prezentacja wydarzeń w odpowiednich dniach.

Kolorowe kategorie i legenda.

Wybór roku szkolnego.

Podgląd szczegółów wydarzenia.

Panel administratora:

Logowanie i wylogowanie.

Dodawanie, edytowanie i usuwanie wydarzeń.

Zarządzanie kategoriami i ich kolorami.

Zarządzanie latami szkolnymi.

Ustawianie aktywnego roku szkolnego.

Walidacja formularzy.

4. Baza danych
Planowane tabele w Supabase:

events – wydarzenia, daty, opisy i powiązania.

categories – nazwy kategorii i kolory.

school_years – lata szkolne, daty rozpoczęcia i zakończenia oraz status aktywnego roku.

admin_users – identyfikatory użytkowników uprawnionych do administracji.

Logowanie będzie obsługiwane przez Supabase Auth, a dostęp do danych zabezpieczony politykami RLS.

5. Najważniejsze zasady działania
Dane są pobierane z bazy, a nie zapisane na stałe w kodzie.

Zmiana roku szkolnego wyświetla odpowiednie wydarzenia.

Modyfikacje danych są dostępne wyłącznie dla uprawnionego administratora.

Zmiany zapisują się w bazie i pozostają dostępne po ponownym uruch



