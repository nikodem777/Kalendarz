import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import "./Kalendarz.css";

const MONTHS = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];

const WEEKDAYS = [
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela",
];

const SHORT_WEEKDAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];
const pad = (n) => String(n).padStart(2, "0");

const dateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const getCalendarDays = (year, month) => {
  const first = new Date(year, month, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
};

const categoryClass = (name = "") => {
  const normalized = name.toLowerCase();

  if (normalized.includes("sprawdzian")) return "test";
  if (normalized.includes("wyciecz")) return "trip";
  if (
    normalized.includes("wolny") ||
    normalized.includes("święto") ||
    normalized.includes("swieto")
  )
    return "holiday";

  return "event";
};

function MonthOverview({ year, eventsByDate, todayKey, onSelectMonth }) {
  return (
    <div className="month-overview-grid">
      {MONTHS.map((month, monthIndex) => {
        const days = getCalendarDays(year, monthIndex);
        const monthEventIds = new Set(
          days
            .filter((date) => date.getMonth() === monthIndex)
            .flatMap((date) =>
              (eventsByDate.get(dateKey(date)) || []).map((event) => event.id),
            ),
        );

        return (
          <section className="month-overview-card" key={month}>
            <button
              type="button"
              className="month-overview-title"
              onClick={() => onSelectMonth(monthIndex)}
              aria-label={`Otwórz ${month} ${year}`}
            >
              <strong>{month}</strong>
              <span>{monthEventIds.size} wydarzeń</span>
            </button>
            <div className="mini-calendar-grid">
              {SHORT_WEEKDAYS.map((day) => (
                <span className="mini-weekday" key={day}>
                  {day}
                </span>
              ))}
              {days.map((date) => {
                const key = dateKey(date);
                const isCurrentMonth = date.getMonth() === monthIndex;
                const dayEvents = eventsByDate.get(key) || [];

                return (
                  <span
                    className={`mini-day ${isCurrentMonth ? "" : "outside"} ${
                      key === todayKey ? "today" : ""
                    }`}
                    key={key}
                    title={
                      dayEvents.length
                        ? `${dayEvents.length} wydarzeń`
                        : undefined
                    }
                  >
                    <span>{date.getDate()}</span>
                    {dayEvents.length > 0 && (
                      <span className="mini-day-markers" aria-hidden="true">
                        {dayEvents.slice(0, 3).map((event) => (
                          <i
                            key={event.id}
                            style={{
                              backgroundColor:
                                event.categories?.color || "#8753c7",
                            }}
                          />
                        ))}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function Kalendarz({
  user,
  onLogout,
  onLogin,
  accessWarning = "",
  canManageEvents = false,
}) {
  const today = new Date();
  const currentYear = today.getFullYear();

  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [schoolYearId, setSchoolYearId] = useState("");

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [isMonthOverview, setIsMonthOverview] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dateKey(today));
  const [editingEventId, setEditingEventId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [categorySuggestionsOpen, setCategorySuggestionsOpen] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(-1);

  const [form, setForm] = useState({
    title: "",
    startDate: dateKey(today),
    endDate: dateKey(today),
    singleDay: true,
    startTime: "10:00",
    allDay: false,
    categoryId: "",
    categoryName: "",
    description: "",
  });

  const activeSchoolYear = schoolYears.find(
    (year) => String(year.id) === String(schoolYearId),
  );
  const filteredCategories = categories.filter((category) =>
    category.name
      .toLocaleLowerCase()
      .includes(form.categoryName.trim().toLocaleLowerCase()),
  );

  // Pobieranie wydarzeń dla wybranego roku szkolnego.
  const fetchEvents = useCallback(
    (yearId) =>
      supabase
        .from("events")
        .select(
          `
        *,
        categories (
          id,
          name,
          color
        )
      `,
        )
        .eq("school_year_id", yearId)
        .order("start_date", { ascending: true }),
    [],
  );

  useEffect(() => {
    // Ignorujemy wynik, jeśli komponent odmontowano przed odpowiedzią Supabase.
    let active = true;

    Promise.all([
      supabase
        .from("school_years")
        .select("id, name, start_date, end_date, is_active")
        .order("start_date", { ascending: false }),
      supabase
        .from("categories")
        .select("id, name, color, description")
        .order("name"),
    ])
      .then(
        ([
          { data: years, error: yearsError },
          { data: cats, error: catsError },
        ]) => {
          if (!active) return;
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

            const activeYear = loadedYears.find((year) => year.is_active);
            return String((activeYear || loadedYears[0])?.id ?? "");
          });

          setForm((current) => ({
            ...current,
            categoryId:
              current.categoryId || String(loadedCategories[0]?.id ?? ""),
            categoryName:
              current.categoryName || loadedCategories[0]?.name || "",
          }));
        },
      )
      .catch((err) => {
        if (active) setError(`Nie udało się pobrać danych: ${err.message}`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!schoolYearId) return undefined;

    // Po zmianie roku szkolnego starsze zapytanie nie może nadpisać nowszych danych.
    let active = true;

    fetchEvents(schoolYearId).then(({ data, error: eventsError }) => {
      if (!active) return;
      if (eventsError) {
        setError(`Nie udało się pobrać wydarzeń: ${eventsError.message}`);
        return;
      }

      setEvents(data || []);
    });

    return () => {
      active = false;
    };
  }, [schoolYearId, fetchEvents]);

  const calendarDays = useMemo(
    () => getCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const monthEvents = useMemo(
    () =>
      events.filter((event) => {
        const monthStart = dateKey(new Date(viewYear, viewMonth, 1));
        const monthEnd = dateKey(new Date(viewYear, viewMonth + 1, 0));
        return event.start_date <= monthEnd && event.end_date >= monthStart;
      }),
    [events, viewYear, viewMonth],
  );
  const yearEventCount = useMemo(
    () =>
      events.filter(
        (event) =>
          event.start_date <= dateKey(new Date(viewYear, 11, 31)) &&
          event.end_date >= dateKey(new Date(viewYear, 0, 1)),
      ).length,
    [events, viewYear],
  );
  const calendarYears = Array.from(
    new Set([
      currentYear - 1,
      currentYear,
      currentYear + 1,
      currentYear + 2,
      viewYear - 1,
      viewYear,
      viewYear + 1,
      ...schoolYears.flatMap((year) => [
        Number(year.start_date.slice(0, 4)),
        Number(year.end_date.slice(0, 4)),
      ]),
    ]),
  ).sort((a, b) => a - b);

  const eventsByDate = useMemo(() => {
    const byDate = new Map();

    // Wydarzenie wielodniowe przypisujemy do każdego dnia zakresu, aby widoczne było w każdej komórce.
    for (const event of events) {
      const current = new Date(`${event.start_date}T12:00:00`);
      const end = new Date(`${event.end_date}T12:00:00`);

      while (current <= end) {
        const key = dateKey(current);
        const dayEvents = byDate.get(key);

        if (dayEvents) {
          dayEvents.push(event);
        } else {
          byDate.set(key, [event]);
        }

        current.setDate(current.getDate() + 1);
      }
    }

    return byDate;
  }, [events]);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setNotice("");
  }

  function chooseDate(date) {
    const key = dateKey(date);
    setSelectedDate(key);
    if (!editingEventId) {
      setForm((current) => ({
        ...current,
        startDate: key,
        endDate: current.singleDay ? key : current.endDate,
      }));
    }
    setNotice("");
  }

  function updateCategory(name) {
    const category = categories.find(
      (item) =>
        item.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase(),
    );

    setForm((current) => ({
      ...current,
      categoryName: name,
      categoryId: category ? String(category.id) : "",
    }));
    setNotice("");
  }

  function chooseCategory(category) {
    setForm((current) => ({
      ...current,
      categoryName: category.name,
      categoryId: String(category.id),
    }));
    setCategorySuggestionsOpen(false);
    setActiveCategoryIndex(-1);
    setNotice("");
  }

  function changeMonth(delta) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
    setIsMonthOverview(false);
  }

  function openMonth(month) {
    setViewMonth(month);
    setIsMonthOverview(false);
    setError("");
    setNotice("");
  }

  function returnToYearOverview() {
    setIsMonthOverview(true);
  }

  function resetEventForm(date = selectedDate) {
    setEditingEventId(null);
    setForm((current) => ({
      ...current,
      title: "",
      startDate: date,
      endDate: date,
      singleDay: true,
      startTime: "10:00",
      allDay: false,
      description: "",
    }));
    setError("");
    setNotice("");
  }

  function startEditingEvent(event) {
    if (!canManageEvents) return;

    const [year, month] = event.start_date.split("-").map(Number);
    setEditingEventId(event.id);
    setSelectedDate(event.start_date);
    setViewYear(year);
    setViewMonth(month - 1);
    setIsMonthOverview(false);
    setForm({
      title: event.title || "",
      startDate: event.start_date,
      endDate: event.end_date || event.start_date,
      singleDay: event.start_date === event.end_date,
      startTime: event.start_time?.slice(0, 5) || "10:00",
      allDay: !event.start_time,
      categoryId: String(event.category_id || event.categories?.id || ""),
      categoryName: event.categories?.name || "",
      description: event.description || "",
    });
    setError("");
    setNotice("");
  }

  function goToToday() {
    const key = dateKey(new Date());
    setSelectedDate(key);
    if (!editingEventId) {
      setForm((current) => ({
        ...current,
        startDate: key,
        endDate: current.singleDay ? key : current.endDate,
      }));
    }
    setViewYear(new Date().getFullYear());
    setViewMonth(new Date().getMonth());
    setIsMonthOverview(false);
  }

  async function addEvent(e) {
    e.preventDefault();
    setError("");
    setNotice("");

    const endDate = form.singleDay ? form.startDate : form.endDate;

    if (!form.title.trim() || !form.startDate || !endDate) {
      setError("Uzupełnij nazwę i datę wydarzenia.");
      return;
    }

    if (!form.categoryId) {
      setError("Wybierz kategorię z listy podpowiedzi.");
      return;
    }

    if (!schoolYearId) {
      setError("Najpierw dodaj rok szkolny w bazie Supabase.");
      return;
    }

    if (!form.singleDay && endDate < form.startDate) {
      setError(
        "Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.",
      );
      return;
    }

    if (
      activeSchoolYear &&
      (form.startDate < activeSchoolYear.start_date ||
        endDate > activeSchoolYear.end_date)
    ) {
      setError(
        `Data musi mieścić się w roku szkolnym ${activeSchoolYear.name}.`,
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_date: form.startDate,
        end_date: endDate,
        start_time:
          form.singleDay && !form.allDay ? form.startTime || null : null,
        end_time: null,
        category_id: Number(form.categoryId),
        school_year_id: Number(schoolYearId),
      };

      if (editingEventId) {
        const { data: updatedEvent, error: updateError } = await supabase
          .from("events")
          .update(payload)
          .eq("id", editingEventId)
          .select("id")
          .maybeSingle();

        if (updateError) throw updateError;
        if (!updatedEvent) {
          throw new Error(
            "Nie znaleziono wydarzenia lub brak uprawnień do jego edycji.",
          );
        }
      } else {
        const { error: insertError } = await supabase
          .from("events")
          .insert(payload);

        if (insertError) throw insertError;
      }

      const { data: refreshedEvents, error: eventsError } =
        await fetchEvents(schoolYearId);

      if (eventsError) {
        setError(`Nie udało się pobrać wydarzeń: ${eventsError.message}`);
      } else {
        setEvents(refreshedEvents || []);
      }

      const [year, month] = form.startDate.split("-").map(Number);
      setViewYear(year);
      setViewMonth(month - 1);
      setIsMonthOverview(false);
      setSelectedDate(form.startDate);
      setEditingEventId(null);

      setForm((current) => ({
        ...current,
        title: "",
        endDate: form.startDate,
        singleDay: true,
        startTime: "10:00",
        allDay: false,
        description: "",
      }));

      setNotice(
        editingEventId
          ? "Zmiany wydarzenia zapisano."
          : "Wydarzenie zapisano w bazie Supabase.",
      );
    } catch (err) {
      setError(
        err.code === "42501"
          ? `Brak uprawnień do ${editingEventId ? "edycji" : "dodawania"} wydarzeń. Sprawdź uprawnienia administratora w Supabase.`
          : `Nie udało się ${editingEventId ? "zaktualizować" : "zapisać"} wydarzenia: ${err.message}`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteEvent(event) {
    if (!canManageEvents || !schoolYearId) return;
    if (!window.confirm(`Czy na pewno usunąć wydarzenie „${event.title}”?`)) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const { data: deletedEvent, error: deleteError } = await supabase
        .from("events")
        .delete()
        .eq("id", event.id)
        .select("id")
        .maybeSingle();

      if (deleteError) throw deleteError;
      if (!deletedEvent) {
        throw new Error(
          "Nie znaleziono wydarzenia lub brak uprawnień do jego usunięcia.",
        );
      }

      const { data: refreshedEvents, error: eventsError } =
        await fetchEvents(schoolYearId);
      if (eventsError) throw eventsError;

      setEvents(refreshedEvents || []);
      if (editingEventId === event.id) resetEventForm(selectedDate);
      setNotice("Wydarzenie usunięto.");
    } catch (err) {
      setError(`Nie udało się usunąć wydarzenia: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  const schoolYearLabel = activeSchoolYear?.name || "Nie wybrano";
  const profileName =
    user?.name ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "Zalogowany użytkownik";
  const selectedDayEvents = eventsByDate.get(selectedDate) || [];
  const selectedDateLabel = new Date(
    `${selectedDate}T12:00:00`,
  ).toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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

      <main className="page">
        <section className="page-heading">
          <div>
            <h1>Twój szkolny kalendarz</h1>
            <p>
              Wszystkie ważne terminy w jednym miejscu. Wybierz miesiąc, aby
              zobaczyć szczegóły.
            </p>
          </div>
          <div className="page-heading-actions">
            <button
              type="button"
              className="outline-btn print-btn"
              onClick={() => window.print()}
            >
              Drukuj
            </button>
            <div className="school-year">
              Rok szkolny <strong>{schoolYearLabel}</strong>
            </div>
          </div>
        </section>

        {accessWarning && (
          <div className="notice error-message" role="alert">
            {accessWarning}
          </div>
        )}

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
          <div
            className={
              canManageEvents ? "workspace" : "workspace public-calendar"
            }
          >
            <section className="calendar-card">
              <div className="calendar-toolbar">
                <div>
                  <h2>
                    {isMonthOverview
                      ? `Kalendarz ${viewYear}`
                      : `${MONTHS[viewMonth]} ${viewYear}`}
                  </h2>
                  <p>
                    {isMonthOverview
                      ? `${yearEventCount} wydarzeń w roku · wybierz miesiąc`
                      : `${monthEvents.length} wydarzeń w tym miesiącu`}
                  </p>
                </div>

                <div className="calendar-controls">
                  <select
                    aria-label="Wybierz rok"
                    value={viewYear}
                    onChange={(e) => setViewYear(Number(e.target.value))}
                  >
                    {calendarYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>

                  {isMonthOverview ? (
                    <>
                      <button
                        type="button"
                        className="arrow-btn"
                        aria-label="Poprzedni rok"
                        onClick={() => setViewYear((year) => year - 1)}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="arrow-btn"
                        aria-label="Następny rok"
                        onClick={() => setViewYear((year) => year + 1)}
                      >
                        ›
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="outline-btn overview-return"
                        onClick={returnToYearOverview}
                      >
                        ← 12 miesięcy
                      </button>
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
                          <option key={month} value={index}>
                            {month}
                          </option>
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
                    </>
                  )}
                </div>
              </div>

              {isMonthOverview ? (
                <MonthOverview
                  year={viewYear}
                  eventsByDate={eventsByDate}
                  todayKey={dateKey(today)}
                  onSelectMonth={openMonth}
                />
              ) : (
                <div
                  className="calendar-grid"
                  role="grid"
                  aria-label={`${MONTHS[viewMonth]} ${viewYear}`}
                >
                {WEEKDAYS.map((day) => (
                  <div className="weekday" key={day}>
                    {day}
                  </div>
                ))}

                {calendarDays.map((date) => {
                  const key = dateKey(date);
                  const isCurrentMonth = date.getMonth() === viewMonth;
                  const isSelected = key === selectedDate;
                  const isToday = key === dateKey(today);

                  const dayEvents = eventsByDate.get(key) || [];

                  return (
                    <div
                      role="gridcell"
                      tabIndex={0}
                      key={key}
                      className={`day-cell ${isCurrentMonth ? "" : "outside"} ${
                        isSelected ? "selected" : ""
                      } ${isToday ? "today" : ""}`}
                      onClick={() => chooseDate(date)}
                      onKeyDown={(e) => {
                        if (
                          e.target === e.currentTarget &&
                          (e.key === "Enter" || e.key === " ")
                        ) {
                          e.preventDefault();
                          chooseDate(date);
                        }
                      }}
                      aria-label={`${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}${dayEvents.length ? `, ${dayEvents.length} wydarzeń` : ""}`}
                    >
                      <span
                        className={`day-number ${isToday ? "today-number" : ""}`}
                      >
                        {date.getDate()}
                      </span>

                      {isToday && <span className="today-label">Dzisiaj</span>}

                      <div className="day-events">
                        {dayEvents.map((event) => {
                          const category = event.categories;
                          const cssClass = categoryClass(category?.name);

                          return (
                            <button
                              type="button"
                              className={`event-chip ${cssClass}`}
                              key={event.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (canManageEvents) {
                                  startEditingEvent(event);
                                } else {
                                  chooseDate(date);
                                }
                              }}
                              style={
                                category?.color
                                  ? {
                                      borderColor: category.color,
                                      backgroundColor: `${category.color}18`,
                                      color: category.color,
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
                            </button>
                          );
                        })}

                        {dayEvents.length > 2 && (
                          <span className="more-events">
                            Zobacz +{dayEvents.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}

              {!isMonthOverview && selectedDayEvents.length > 0 && (
                <section className="selected-day-events" aria-live="polite">
                  <div className="selected-day-heading">
                    <h3>Wydarzenia: {selectedDateLabel}</h3>
                    <span>{selectedDayEvents.length}</span>
                  </div>
                  <ul className="selected-day-list">
                    {selectedDayEvents.map((event) => {
                      const category = event.categories;
                      const startsToday = event.start_date === selectedDate;

                      return (
                        <li
                          className="selected-day-item"
                          key={event.id}
                          style={{
                            borderLeftColor: category?.color || "#dce5f1",
                          }}
                        >
                          <div className="selected-day-item-heading">
                            <strong>{event.title}</strong>
                            <div className="selected-day-meta">
                              {startsToday && event.start_time && (
                                <time>{event.start_time.slice(0, 5)}</time>
                              )}
                              {category?.name && (
                                <span>
                                  <i
                                    style={{
                                      backgroundColor:
                                        category.color || "#8753c7",
                                    }}
                                  />
                                  {category.name}
                                </span>
                              )}
                            </div>
                          </div>
                          {event.description && <p>{event.description}</p>}
                          {canManageEvents && (
                            <div className="event-item-actions">
                              <button
                                type="button"
                                onClick={() => startEditingEvent(event)}
                              >
                                Edytuj
                              </button>
                              <button
                                type="button"
                                className="delete-action"
                                onClick={() => deleteEvent(event)}
                                disabled={saving}
                              >
                                Usuń
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

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

            {canManageEvents && (
              <aside className="form-card">
                <div className="form-heading">
                  <div className="form-heading-icon">▣</div>
                  <h2>
                    {editingEventId ? "Edytuj wydarzenie" : "Dodaj wydarzenie"}
                  </h2>
                </div>

                <p className="form-intro">
                  {editingEventId
                    ? "Zmień dane wydarzenia i zapisz aktualizację."
                    : "Uzupełnij dane i zapisz nowy termin w kalendarzu."}
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

                  <label htmlFor="event-category">
                    Kategoria <span>*</span>
                  </label>
                  <div className="category-autocomplete">
                    <input
                      id="event-category"
                      type="text"
                      value={form.categoryName}
                      onChange={(e) => {
                        updateCategory(e.target.value);
                        setCategorySuggestionsOpen(true);
                        setActiveCategoryIndex(-1);
                      }}
                      onFocus={() => setCategorySuggestionsOpen(true)}
                      onBlur={() => setCategorySuggestionsOpen(false)}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          setCategorySuggestionsOpen(true);
                          setActiveCategoryIndex((current) =>
                            Math.min(
                              current + 1,
                              filteredCategories.length - 1,
                            ),
                          );
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          setActiveCategoryIndex((current) =>
                            Math.max(current - 1, -1),
                          );
                        } else if (e.key === "Escape") {
                          setCategorySuggestionsOpen(false);
                          setActiveCategoryIndex(-1);
                        } else if (
                          e.key === "Enter" &&
                          categorySuggestionsOpen &&
                          filteredCategories[activeCategoryIndex]
                        ) {
                          e.preventDefault();
                          chooseCategory(
                            filteredCategories[activeCategoryIndex],
                          );
                        }
                      }}
                      placeholder="Wpisz lub wybierz kategorię"
                      autoComplete="off"
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded={categorySuggestionsOpen}
                      aria-controls="event-category-listbox"
                      aria-activedescendant={
                        activeCategoryIndex >= 0
                          ? `event-category-option-${filteredCategories[activeCategoryIndex]?.id}`
                          : undefined
                      }
                      required
                    />
                    {categorySuggestionsOpen && (
                      <div
                        className="category-options"
                        id="event-category-listbox"
                        role="listbox"
                      >
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((category, index) => (
                            <button
                              className={`category-option ${
                                index === activeCategoryIndex ? "active" : ""
                              }`}
                              id={`event-category-option-${category.id}`}
                              key={category.id}
                              type="button"
                              role="option"
                              aria-selected={index === activeCategoryIndex}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => chooseCategory(category)}
                            >
                              <i
                                style={{
                                  backgroundColor: category.color || "#8753c7",
                                }}
                                aria-hidden="true"
                              />
                              {category.name}
                            </button>
                          ))
                        ) : (
                          <div className="category-empty">
                            Brak pasujących kategorii
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-toggle">
                    <input
                      id="single-day-event"
                      type="checkbox"
                      checked={form.singleDay}
                      onChange={(e) => {
                        const singleDay = e.target.checked;
                        setForm((current) => ({
                          ...current,
                          singleDay,
                          endDate: singleDay ? current.startDate : "",
                        }));
                      }}
                    />
                    <label htmlFor="single-day-event">
                      Wydarzenie jednodniowe
                    </label>
                  </div>

                  <div className="date-row">
                    <div>
                      <label htmlFor="event-start-date">
                        {form.singleDay ? "Data" : "Data od"} <span>*</span>
                      </label>
                      <input
                        id="event-start-date"
                        type="date"
                        value={form.startDate}
                        onChange={(e) => {
                          const startDate = e.target.value;
                          setForm((current) => ({
                            ...current,
                            startDate,
                            endDate: current.singleDay
                              ? startDate
                              : current.endDate,
                          }));
                          setSelectedDate(startDate);
                          setNotice("");
                        }}
                        required
                      />
                    </div>

                    {!form.singleDay && (
                      <div>
                        <label htmlFor="event-end-date">
                          Data do <span>*</span>
                        </label>
                        <input
                          id="event-end-date"
                          type="date"
                          value={form.endDate}
                          min={form.startDate || undefined}
                          onChange={(e) =>
                            updateForm("endDate", e.target.value)
                          }
                          required
                        />
                      </div>
                    )}
                  </div>

                  {form.singleDay ? (
                    <>
                      <div className="form-toggle">
                        <input
                          id="all-day-event"
                          type="checkbox"
                          checked={form.allDay}
                          onChange={(e) =>
                            updateForm("allDay", e.target.checked)
                          }
                        />
                        <label htmlFor="all-day-event">
                          Wydarzenie całodniowe
                        </label>
                      </div>

                      {!form.allDay && (
                        <>
                          <label htmlFor="event-start-time">
                            Godzina rozpoczęcia <span>*</span>
                          </label>
                          <input
                            id="event-start-time"
                            type="time"
                            value={form.startTime}
                            onChange={(e) =>
                              updateForm("startTime", e.target.value)
                            }
                            required
                          />
                        </>
                      )}
                    </>
                  ) : (
                    <p className="form-hint">
                      Dla wydarzenia wielodniowego godzina nie jest ustawiana.
                    </p>
                  )}

                  <label htmlFor="event-description">Opis (opcjonalnie)</label>
                  <textarea
                    id="event-description"
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    placeholder="Dodaj szczegóły wydarzenia..."
                    rows="3"
                  />

                  <div className="event-form-actions">
                    <button
                      className="submit-btn"
                      type="submit"
                      disabled={saving || categories.length === 0}
                    >
                      {!editingEventId && <span>＋</span>}
                      {saving
                        ? "Zapisywanie..."
                        : editingEventId
                          ? "Zapisz zmiany"
                          : "Dodaj wydarzenie"}
                    </button>
                    {editingEventId && (
                      <>
                        <button
                          className="form-secondary-btn"
                          type="button"
                          onClick={() => resetEventForm(selectedDate)}
                          disabled={saving}
                        >
                          Anuluj edycję
                        </button>
                        <button
                          className="form-delete-btn"
                          type="button"
                          onClick={() => {
                            const event = events.find(
                              (item) => item.id === editingEventId,
                            );
                            if (event) deleteEvent(event);
                          }}
                          disabled={saving}
                        >
                          Usuń wydarzenie
                        </button>
                      </>
                    )}
                  </div>

                  {categories.length === 0 && (
                    <p className="required-note">
                      Najpierw dodaj kategorie w tabeli categories.
                    </p>
                  )}

                  <p className="required-note">* Pola wymagane</p>
                </form>
              </aside>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
