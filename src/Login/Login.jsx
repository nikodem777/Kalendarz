
import { useState } from "react";
import { supabase } from "../supabaseClient";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage("Nieprawidłowy e-mail lub hasło.");
      }
      // Po udanym logowaniu App.jsx wyświetli kalendarz.
    } catch {
      setErrorMessage("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage(
        "Wpisz swój adres e-mail, aby odzyskać hasło."
      );
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim()
      );

      if (error) {
        setErrorMessage(
          "Nie udało się wysłać linku. Sprawdź adres e-mail."
        );
      } else {
        setErrorMessage(
          "Jeśli konto istnieje, instrukcja odzyskiwania hasła została wysłana."
        );
      }
    } catch {
      setErrorMessage("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />

      <section className="login-wrapper">
        <header className="login-header">
          <div className="brand-title">
            <div className="brand-icon">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="16" rx="3" />
                <path d="M16 3v4M8 3v4M3 10h18" />
                <path d="m9 15 2 2 4-4" />
              </svg>
            </div>

            <h1>Kalendarz szkolny</h1>
          </div>

          <p>Twój szkolny dzień, dobrze zaplanowany.</p>
        </header>

        <div className="login-card">
          <div className="card-heading">
            <span className="eyebrow">WITAJ PONOWNIE!</span>
            <h2>Zaloguj się</h2>
            <p>Wprowadź swoje dane, aby kontynuować.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Adres e-mail</label>

              <div className="input-wrapper">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="m4 7 8 6 8-6" />
                </svg>

                <input
                  id="email"
                  type="email"
                  placeholder="np. uczen@szkola.pl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Hasło</label>

              <div className="input-wrapper">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden="true"
                >
                  <rect x="4" y="10" width="16" height="11" rx="3" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Wpisz swoje hasło"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Ukryj hasło" : "Pokaż hasło"
                  }
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      aria-hidden="true"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 5.2A11 11 0 0 1 12 5c5 0 8.5 4.5 9.5 7" />
                      <path d="M6.2 6.2C3.9 7.6 2.8 9.7 2.5 12c1 2.5 4.5 7 9.5 7 1.3 0 2.5-.3 3.5-.8" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      aria-hidden="true"
                    >
                      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="forgot-password-row">
                <button
                  className="forgot-link"
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  Nie pamiętasz hasła?
                </button>
              </div>
            </div>

            {errorMessage && (
              <p className="login-error" role="alert">
                {errorMessage}
              </p>
            )}

            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              <span>
                {loading ? "Proszę czekać..." : "Zaloguj się"}
              </span>

              {!loading && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>
          </form>

          <div className="card-footer">
            <span className="status-dot" />
            Twój szkolny świat w jednym miejscu
          </div>
        </div>

        <footer className="page-footer">
          © {new Date().getFullYear()} Kalendarz szkolny
          <span className="footer-separator">·</span>
          Planuj. Ucz się. Osiągaj.
        </footer>
      </section>
    </main>
  );
}
