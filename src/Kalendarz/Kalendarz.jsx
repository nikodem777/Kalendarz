
export default function Kalendarz({ user, onLogout }) {
  return (
    <main style={{
      minHeight: "100vh",
      padding: "40px",
      fontFamily: "Inter, sans-serif",
      background: "#f0f4fa",
      color: "#172033",
    }}>
      <h1>Twój kalendarz szkolny 📅</h1>

      <p>
        Zalogowano jako: <strong>{user.email}</strong>
      </p>

      <p>Witaj w swoim szkolnym świecie!</p>

      <button onClick={onLogout}>
        Wyloguj się
      </button>
    </main>
  );
}
