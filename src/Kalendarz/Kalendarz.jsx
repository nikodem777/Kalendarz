
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import "./Kalendarz.css";

const MONTHS = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
];

const WEEKDAYS = [
  "Poniedziałek", "Wtorek", "Środa", "Czwartek",
  "Piątek", "Sobota", "Niedziela"
];

const pad = (n) => String(n).padStart(2, "0");

const dateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const categoryClass = (name = "") => {
  const normalized = name.toLowerCase();

  if (normalized.includes("sprawdzian")) return "test";
  if (normalized.includes("wyciecz")) return "trip";
  if (
    normalized.includes("wolny") ||
    normalized.includes("święto") ||
    normalized.includes("swieto")
  ) return "holiday";

  return "event";
};

export default function Kalendarz({ user, onLogout }) {
  const today = new Date();

  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [schoolYearId, setSchoolYearId] = useState("");

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(dateKey(today));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState({
    title: "",
    date: dateKey(today),
    start: "10:00",
    end: "10:45",
    categoryId: "",
    place: "",
    description: ""
  });

  const activeSchoolYear = schoolYears.find(
    (year) => String(year.id) === String(schoolYearId)
  );

  // Pobieranie lat szkolnych i kategorii.
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        { data: years, error: yearsError },
        { data: cats, error: catsError }
      ] = await Promise.all([
        supabase
          .from("school_years")
          .select("id, name, start_date, end_date, is_active")
          .order("start_date", { ascending: false }),

        supabase
          .from("categories")
          .select("id, name, color, description")
          .order("name")
      ]);

      if (yearsError) throw yearsError;
      if (catsError) throw catsError;

      const loadedYears = years || [];
      const loadedCategories = cats || [];

      setSchoolYears(loadedYears);
      setCategories(loadedCategories);

      setSchoolYearId((current) => {
        if (
          current &&
          loadedYears.some((year) => String(year.id) === String(current))
        ) {
          return current;
        }

        const active = loadedYears.find((year) => year.is_active);
        return String((active || loadedYears[0])?.id ?? "");
      });

      setForm((current) => ({
        ...current,
        categoryId:
          current.categoryId || String(loadedCategories[0]?.id ?? "")
      }));
    } catch (err) {
      setError(`Nie udało się pobrać danych: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Pobieranie wydarzeń dla wybranego roku szkolnego.
  const loadEvents = useCallback(async (yearId) => {
    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        categories (
          id,
          name,
          color
        )
      `)
      .eq("school_year_id", yearId)
      .order("start_date", { ascending: true });

    if (error) {
      setError(`Nie udało się pobrać wydarzeń: ${error.message}`);
      return;
    }

    setEvents(data || []);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (schoolYearId) {
      loadEvents(schoolYearId);
    } else {
      setEvents([]);
    }
  }, [schoolYearId, loadEvents]);

  const calendarDays = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const start = new Date(viewYear, viewMonth, 1 - mondayOffset);

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }, [viewYear, viewMonth]);

  const monthEvents = events.filter((event) => {
    const date = new Date(`${event.start_date}T12:00:00`);
    return (
      date.getFullYear() === viewYear &&
      date.getMonth() === viewMonth
    );
  });

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setNotice("");
  }

  function chooseDate(date) {
    const key = dateKey(date);
    setSelectedDate(key);
    updateForm("date", key);
  }

  function changeMonth(delta) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function goToToday() {
    const key = dateKey(new Date());
    setSelectedDate(key);
    setForm((current) => ({ ...current, date: key }));
    setViewYear(new Date().getFullYear());
    setViewMonth(new Date().getMonth());
  }

  async function addEvent(e) {
    e.preventDefault();
    setError("");
    setNotice("");

    if (!form.title.trim() || !form.date || !form.categoryId) {
      setError("Uzupełnij nazwę, datę i kategorię wydarzenia.");
      return;
    }

    if (!schoolYearId) {
      setError("Najpierw dodaj rok szkolny w bazie Supabase.");
      return;
    }

    if (form.start && form.end && form.end < form.start) {
      setError("Godzina zakończenia nie może być wcześniejsza niż rozpoczęcia.");
      return;
    }

    if (
      activeSchoolYear &&
      (
        form.date < activeSchoolYear.start_date ||
        form.date > activeSchoolYear.end_date
      )
    ) {
      setError(
        `Data musi mieścić się w roku szkolnym ${activeSchoolYear.name}.`
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_date: form.date,
        end_date: form.date,
        start_time: form.start || null,
        end_time: form.end || null,
        location: form.place.trim() || null,
        category_id: Number(form.categoryId),
        school_year_id: Number(schoolYearId)
      };

      const { error: insertError } = await supabase
        .from("events")
        .insert(payload);

      if (insertError) throw insertError;

      await loadEvents(schoolYearId);

      const [year, month] = form.date.split("-").map(Number);
      setViewYear(year);
      setViewMonth(month - 1);
      setSelectedDate(form.date);

      setForm((current) => ({
        ...current,
        title: "",
        place: "",
        description: ""
      }));

      setNotice("Wydarzenie zapisano w bazie Supabase.");
    } catch (err) {
      setError(
        err.code === "42501"
          ? "Brak uprawnień do dodawania wydarzeń. Sprawdź, czy użytkownik jest administratorem."
          : `Nie udało się zapisać wydarzenia: ${err.message}`
      );
    } finally {
      setSaving(false);
    }
  }

  const schoolYearLabel = activeSchoolYear?.name || "Nie wybrano";

  return (
    <div className="app-shell">
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

        <div className="profile">
          <div className="avatar">♙</div>
          <div className="profile-copy">
            <strong>
              {user?.name || user?.user_metadata?.full_name ||
                user?.email || "Zalogowany użytkownik"}
            </strong>
            <span>{user?.email || "Kalendarz szkolny"}</span>
          </div>
          <span className="top-divider" />
          <button className="logout" type="button" onClick={onLogout}>
            ⇥ <span>Wyloguj się</span>
          </button>
        </div>
      </header>

      <main className="page">
        <section className="page-heading">
          <div>
            <h1>Twój szkolny kalendarz</h1>
            <p>
              Wszystkie ważne terminy w jednym miejscu.
              Zaplanuj swój miesiąc.
            </p>
          </div>
          <div className="school-year">
            Rok szkolny <strong>{schoolYearLabel}</strong>
          </div>
        </section>

        {error && (
          <div className="notice error-message" role="alert">
            {error}
          </div>
        )}

        {notice && (
          <div className="notice success-message" role="status">
            {notice}
          </div>
        )}

        {loading ? (
          <div className="calendar-card loading-message">
            Pobieranie danych z Supabase...
          </div>
        ) : (
          <div className="workspace">
            <section className="calendar-card">
              <div className="calendar-toolbar">
                <div>
                  <h2>{MONTHS[viewMonth]} {viewYear}</h2>
                  <p>{monthEvents.length} wydarzeń w tym miesiącu</p>
                </div>

                <div className="calendar-controls">
                  <button
                    type="button"
                    className="outline-btn"
                    onClick={goToToday}
                  >
                    Dzisiaj
                  </button>

                  <select
                    aria-label="Wybierz miesiąc"
                    value={viewMonth}
                    onChange={(e) => setViewMonth(Number(e.target.value))}
                  >
                    {MONTHS.map((month, index) => (
                      <option key={month} value={index}>{month}</option>
                    ))}
                  </select>

                  <select
                    aria-label="Wybierz rok"
                    value={viewYear}
                    onChange={(e) => setViewYear(Number(e.target.value))}
                  >
                    {Array.from(
                      { length: 15 },
                      (_, i) => today.getFullYear() - 5 + i
                    ).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="arrow-btn"
                    aria-label="Poprzedni miesiąc"
                    onClick={() => changeMonth(-1)}
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    className="arrow-btn"
                    aria-label="Następny miesiąc"
                    onClick={() => changeMonth(1)}
                  >
                    ›
                  </button>
                </div>
              </div>

              <div className="calendar-grid">
                {WEEKDAYS.map((day) => (
                  <div className="weekday" key={day}>{day}</div>
                ))}

                {calendarDays.map((date) => {
                  const key = dateKey(date);
                  const isCurrentMonth = date.getMonth() === viewMonth;
                  const isSelected = key === selectedDate;
                  const isToday = key === dateKey(today);

                  const dayEvents = events.filter(
                    (event) => key >= event.start_date && key <= event.end_date
                  );

                  return (
                    <button
                      type="button"
                      key={key}
                      className={`day-cell ${isCurrentMonth ? "" : "outside"} ${
                        isSelected ? "selected" : ""
                      } ${isToday ? "today" : ""}`}
                      onClick={() => chooseDate(date)}
                      aria-label={`${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`}
                    >
                      <span className={`day-number ${isToday ? "today-number" : ""}`}>
                        {date.getDate()}
                      </span>

                      {isToday && <span className="today-label">Dzisiaj</span>}

                      <div className="day-events">
                        {dayEvents.slice(0, 2).map((event) => {
                          const category = event.categories;
                          const cssClass = categoryClass(category?.name);

                          return (
                            <div
                              className={`event-chip ${cssClass}`}
                              key={event.id}
                              style={
                                category?.color
                                  ? {
                                      borderColor: category.color,
                                      backgroundColor: `${category.color}18`,
                                      color: category.color
                                    }
                                  : undefined
                              }
                              title={`${event.title}${event.location ? ` — ${event.location}` : ""}`}
                            >
                              {event.start_time && (
                                <span className="event-time">
                                  {event.start_time.slice(0, 5)}
                                </span>
                              )}
                              <span className="event-title">{event.title}</span>
                            </div>
                          );
                        })}

                        {dayEvents.length > 2 && (
                          <span className="more-events">
                            +{dayEvents.length - 2} więcej
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="legend">
                <strong>Legenda</strong>
                {categories.map((category) => (
                  <span className="legend-item" key={category.id}>
                    <i
                      style={{ backgroundColor: category.color || "#8753c7" }}
                    />
                    {category.name}
                  </span>
                ))}
              </div>
            </section>

            <aside className="form-card">
              <div className="form-heading">
                <div className="form-heading-icon">▣</div>
                <h2>Dodaj wydarzenie</h2>
              </div>

              <p className="form-intro">
                Uzupełnij dane i zapisz nowy termin w kalendarzu.
              </p>

              <form onSubmit={addEvent}>
                <label htmlFor="event-title">
                  Nazwa wydarzenia <span>*</span>
                </label>
                <input
                  id="event-title"
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  placeholder="Np. sprawdzian z biologii"
                  required
                />

                <label htmlFor="event-date">Data <span>*</span></label>
                <input
                  id="event-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => {
                    updateForm("date", e.target.value);
                    setSelectedDate(e.target.value);
                  }}
                  required
                />

                <div className="time-row">
                  <div>
                    <label htmlFor="event-start">Od godziny</label>
                    <input
                      id="event-start"
                      type="time"
                      value={form.start}
                      onChange={(e) => updateForm("start", e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="event-end">Do godziny</label>
                    <input
                      id="event-end"
                      type="time"
                      value={form.end}
                      onChange={(e) => updateForm("end", e.target.value)}
                    />
                  </div>
                </div>

                <label htmlFor="event-category">
                  Kategoria <span>*</span>
                </label>
                <div className="select-wrap">
                  <span
                    className={`category-dot ${
                      categoryClass(
                        categories.find(
                          (category) =>
                            String(category.id) === String(form.categoryId)
                        )?.name
                      )
                    }`}
                    style={{
                      backgroundColor:
                        categories.find(
                          (category) =>
                            String(category.id) === String(form.categoryId)
                        )?.color || undefined
                    }}
                  />
                  <select
                    id="event-category"
                    value={form.categoryId}
                    onChange={(e) => updateForm("categoryId", e.target.value)}
                    required
                  >
                    <option value="" disabled>Wybierz kategorię</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <label htmlFor="event-place">Miejsce</label>
                <div className="input-with-icon">
                  <input
                    id="event-place"
                    value={form.place}
                    onChange={(e) => updateForm("place", e.target.value)}
                    placeholder="Np. sala 204"
                  />
                  <span aria-hidden="true">♧</span>
                </div>

                <label htmlFor="event-description">
                  Opis (opcjonalnie)
                </label>
                <textarea
                  id="event-description"
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="Dodaj szczegóły wydarzenia..."
                  rows="3"
                />

                <button
                  className="submit-btn"
                  type="submit"
                  disabled={saving || categories.length === 0}
                >
                  <span>＋</span>
                  {saving ? "Zapisywanie..." : "Dodaj wydarzenie"}
                </button>

                {categories.length === 0 && (
                  <p className="required-note">
                    Najpierw dodaj kategorie w tabeli categories.
                  </p>
                )}

                <p className="required-note">* Pola wymagane</p>
              </form>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
