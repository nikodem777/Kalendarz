import { useEffect, useState } from "react";
import Login from "./Login/Login";
import Kalendarz from "./Kalendarz/Kalendarz";
import AdminPanel from "./Admin/AdminPanel";
import { supabase } from "./supabaseClient";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileRole, setProfileRole] = useState(null);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error) {
        console.error("Błąd sprawdzania sesji:", error.message);
        setUser(null);
      } else {
        setUser(data.session?.user ?? null);
      }

      setLoading(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return undefined;

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

        setProfileRole({
          userId,
          role: error ? "user" : data?.role?.toLowerCase() || "user",
          accessWarning: error
            ? "Nie udało się pobrać roli użytkownika z tabeli profiles."
            : ""
        });
      })
      .catch((error) => {
        if (!active) return;

        console.error("Błąd pobierania roli użytkownika:", error);
        setProfileRole({
          userId,
          role: "user",
          accessWarning: "Nie udało się pobrać roli użytkownika z tabeli profiles."
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

  if (loading || (user && profileRole?.userId !== user.id)) {
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