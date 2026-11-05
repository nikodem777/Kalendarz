import Kalendarz from "../Kalendarz/Kalendarz";

export default function AdminPanel({ user, onLogout, accessWarning }) {
  return (
    <Kalendarz
      user={user}
      onLogout={onLogout}
      accessWarning={accessWarning}
      canManageEvents
    />
  );
}