import { useEffect, useState } from "react";
import Login from "./Login/Login";
import Kalendarz from "./Kalendarz/Kalendarz";
import AdminPanel from "./Admin/AdminPanel";
import { supabase } from "./supabaseClient";

function App() {
  const [user, setUser] = useState(null);
  const [profileRole, setProfileRole] = useState(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        // Po zalogowaniu na nowe konto poprzednia rola nie może wpływać na widok.
        setProfileRole(null);
        setUser(session?.user ?? null);
      } else if (event === "SIGNED_OUT") {
        setProfileRole(null);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return undefined;

    // Odpowiedź jest ważna tylko dla bieżącego konta; cleanup blokuje zapis spóźnionego wyniku.
    let active = true;

    supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;

        if (error) {
          console.error("Błąd pobierania roli użytkownika:", error.message);
        }

        // Brak roli lub błąd odczytu nie przyznaje uprawnień administratora.
        setProfileRole({
          userId,
          role: error ? "user" : data?.role?.toLowerCase() || "user",
          accessWarning: error
            ? "Nie udało się pobrać roli użytkownika z tabeli profiles."
            : "",
        });
      })
      .catch((error) => {
        if (!active) return;

        console.error("Błąd pobierania roli użytkownika:", error);
        setProfileRole({
          userId,
          role: "user",
          accessWarning:
            "Nie udało się pobrać roli użytkownika z tabeli profiles.",
        });
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Błąd wylogowania:", error.message);
    }
  };

  if (user && profileRole?.userId !== user.id) {
    // Czekamy na rolę bieżącego użytkownika, zanim wybierzemy widok kalendarza.
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f1f4f9",
          color: "#172033",
          fontFamily: "Inter, sans-serif",
          fontSize: "16px",
        }}
      >
        Ładowanie...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const CalendarView = profileRole.role === "admin" ? AdminPanel : Kalendarz;

  return (
    <CalendarView
      user={user}
      onLogout={handleLogout}
      accessWarning={profileRole.accessWarning}
    />
  );
}

export default App;
