import { useEffect, useState } from "react";
import Login from "./Login/Login";
import Kalendarz from "./Kalendarz/Kalendarz";
import { supabase } from "./supabaseClient";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
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

  return (
    <Kalendarz
      user={user}
      onLogout={async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
          console.error("Błąd wylogowania:", error.message);
        }
      }}
    />
  );
}

export default App;