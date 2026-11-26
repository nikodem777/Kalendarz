export default function CalendarHeader({ user, profileName, canManageEvents, onLogout, onLogin }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <rect x="3.5" y="5" width="17" height="16" rx="3" />
            <path d="M7.5 3v4M16.5 3v4M4 9h16M8 12h2m4 0h2M8 16h2m4 0h2" />
          </svg>
        </div>
        <span>Kalendarz Szkolny</span>
      </div>

      {user ? (
        <div className="profile">
          <div className="avatar">♙</div>
          <div className="profile-copy">
            <strong>{canManageEvents ? "Administrator" : profileName}</strong>
            {user.email && profileName !== user.email && (
              <span>{user.email}</span>
            )}
          </div>
          <span className="top-divider" />
          <button className="logout" type="button" onClick={onLogout}>
            ⇥ <span>Wyloguj się</span>
          </button>
        </div>
      ) : (
        <div className="profile">
          <button
            className="logout login-entry"
            type="button"
            onClick={onLogin}
          >
            Zaloguj się
          </button>
        </div>
      )}
    </header>
  );
}
