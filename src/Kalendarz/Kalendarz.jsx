import { useCallback, useMemo, useRef, useState } from "react";
import CalendarHeader from "./components/CalendarHeader";
import CalendarPageHeading from "./components/CalendarPageHeading";
import CalendarToolbar from "./components/CalendarToolbar";
import EventLegend from "./components/EventLegend";
import EventForm from "./components/EventForm";
import MonthCalendarGrid from "./components/MonthCalendarGrid";
import MonthOverview from "./components/MonthOverview";
import SelectedDayEvents from "./components/SelectedDayEvents";
import EventDialogs from "./components/EventDialogs";
import { dateKey, getCalendarDays } from "./calendarUtils";
import useCalendarData from "./hooks/useCalendarData";
import useEventActions from "./hooks/useEventActions";
import useModalAccessibility from "./hooks/useModalAccessibility";
import "./Kalendarz.css";

export default function Kalendarz({
  user,
  onLogout,
  onLogin,
  accessWarning = "",
  canManageEvents = false,
}) {
  const today = new Date();
  const currentYear = today.getFullYear();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [isMonthOverview, setIsMonthOverview] = useState(true);
  const [selectedDate, setSelectedDate] = useState(dateKey(today));
  const [editingEventId, setEditingEventId] = useState(null);
  const [pendingDeleteEvent, setPendingDeleteEvent] = useState(null);
  const modalInitialFocusRef = useRef(null);
  const modalDialogRef = useRef(null);

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
  const [editForm, setEditForm] = useState({
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

  const initializeFormCategories = useCallback((loadedCategories) => {
    setForm((current) => ({
      ...current,
      categoryId:
        current.categoryId || String(loadedCategories[0]?.id ?? ""),
      categoryName: current.categoryName || loadedCategories[0]?.name || "",
    }));
  }, []);

  const {
    events,
    setEvents,
    categories,
    schoolYears,
    schoolYearId,
    loading,
    fetchEvents,
  } = useCalendarData(setError, initializeFormCategories);

  const activeSchoolYear = schoolYears.find(
    (year) => String(year.id) === String(schoolYearId),
  );
  const editingEvent = events.find(
    (event) => String(event.id) === String(editingEventId),
  );
  const {
    saving,
    addEvent,
    saveEditedEvent,
    deleteEvent,
    confirmDeleteEvent,
  } = useEventActions({
    canManageEvents,
    form,
    editForm,
    editingEventId,
    pendingDeleteEvent,
    schoolYearId,
    activeSchoolYear,
    fetchEvents,
    setEvents,
    setForm,
    setViewYear,
    setViewMonth,
    setIsMonthOverview,
    setSelectedDate,
    setEditingEventId,
    setPendingDeleteEvent,
    setError,
    setNotice,
  });

  const closeDialogs = useCallback(() => {
    setEditingEventId(null);
    setPendingDeleteEvent(null);
    setError("");
  }, [setError]);

  useModalAccessibility({
    isOpen: Boolean(editingEventId || pendingDeleteEvent),
    isBusy: saving,
    dialogRef: modalDialogRef,
    initialFocusRef: modalInitialFocusRef,
    onClose: closeDialogs,
  });

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

  function updateEditForm(field, value) {
    setEditForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function chooseDate(date) {
    const key = dateKey(date);
    setSelectedDate(key);
    setForm((current) => ({
      ...current,
      startDate: key,
      endDate: current.singleDay ? key : current.endDate,
    }));
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

  function closeEditDialog() {
    if (saving) return;
    setEditingEventId(null);
    setError("");
  }

  function closeDeleteDialog() {
    if (saving) return;
    setPendingDeleteEvent(null);
    setError("");
  }

  function startEditingEvent(event) {
    if (!canManageEvents) return;

    const [year, month] = event.start_date.split("-").map(Number);
    setEditingEventId(event.id);
    setSelectedDate(event.start_date);
    setViewYear(year);
    setViewMonth(month - 1);
    setIsMonthOverview(false);
    setEditForm({
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
    setForm((current) => ({
      ...current,
      startDate: key,
      endDate: current.singleDay ? key : current.endDate,
    }));
    setViewYear(new Date().getFullYear());
    setViewMonth(new Date().getMonth());
    setIsMonthOverview(false);
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
      <CalendarHeader
        user={user}
        profileName={profileName}
        canManageEvents={canManageEvents}
        onLogout={onLogout}
        onLogin={onLogin}
      />

      <main className={`page ${isMonthOverview ? "year-print-page" : ""}`}>
        <CalendarPageHeading schoolYearLabel={schoolYearLabel} />

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
              `${canManageEvents ? "workspace" : "workspace public-calendar"} ${
                isMonthOverview ? "year-overview-workspace" : ""
              }`
            }
          >
            <section
              className={`calendar-card ${
                isMonthOverview ? "year-overview-card" : ""
              }`}
            >
              <CalendarToolbar
                isMonthOverview={isMonthOverview}
                viewYear={viewYear}
                setViewYear={setViewYear}
                calendarYears={calendarYears}
                viewMonth={viewMonth}
                setViewMonth={setViewMonth}
                yearEventCount={yearEventCount}
                monthEventCount={monthEvents.length}
                onReturnToYear={returnToYearOverview}
                onToday={goToToday}
                onChangeMonth={changeMonth}
              />

              <div
                className="calendar-view-transition"
                key={
                  isMonthOverview
                    ? `overview-${viewYear}`
                    : `month-${viewYear}-${viewMonth}`
                }
              >
                {isMonthOverview ? (
                  <MonthOverview
                    year={viewYear}
                    eventsByDate={eventsByDate}
                    todayKey={dateKey(today)}
                    onSelectMonth={openMonth}
                  />
                ) : (
                  <MonthCalendarGrid
                    days={calendarDays}
                    viewMonth={viewMonth}
                    viewYear={viewYear}
                    selectedDate={selectedDate}
                    todayKey={dateKey(today)}
                    eventsByDate={eventsByDate}
                    canManageEvents={canManageEvents}
                    onChooseDate={chooseDate}
                    onEditEvent={startEditingEvent}
                  />
                )}
              </div>

              {!isMonthOverview && selectedDayEvents.length > 0 && (
                <SelectedDayEvents
                  events={selectedDayEvents}
                  selectedDate={selectedDate}
                  selectedDateLabel={selectedDateLabel}
                  canManageEvents={canManageEvents}
                  saving={saving}
                  onEdit={startEditingEvent}
                  onDelete={deleteEvent}
                />
              )}

              <EventLegend categories={categories} />
            </section>

            {canManageEvents && (
              <EventForm
                form={form}
                categories={categories}
                saving={saving}
                onSubmit={addEvent}
                onUpdateField={updateForm}
                onCategoryChange={updateCategory}
                onChooseCategory={chooseCategory}
                onStartDateChange={(startDate) => {
                  setForm((current) => ({
                    ...current,
                    startDate,
                    endDate: current.singleDay ? startDate : current.endDate,
                  }));
                  setSelectedDate(startDate);
                  setNotice("");
                }}
              />
            )}
          </div>
        )}

        {canManageEvents && editingEvent && (
          <EventDialogs
            editingEvent={canManageEvents ? editingEvent : null}
            pendingDeleteEvent={canManageEvents ? pendingDeleteEvent : null}
            editForm={editForm}
            categories={categories}
            error={error}
            saving={saving}
            modalDialogRef={modalDialogRef}
            modalInitialFocusRef={modalInitialFocusRef}
            onEditFieldChange={updateEditForm}
            onEditDayModeChange={(singleDay) => {
              setEditForm((current) => ({
                ...current,
                singleDay,
                endDate: singleDay
                  ? current.startDate
                  : current.endDate === current.startDate
                    ? ""
                    : current.endDate,
              }));
              setError("");
            }}
            onEditStartDateChange={(startDate) => {
              setEditForm((current) => ({
                ...current,
                startDate,
                endDate: current.singleDay
                  ? startDate
                  : current.endDate < startDate
                    ? ""
                    : current.endDate,
              }));
              setError("");
            }}
            onSaveEdit={saveEditedEvent}
            onConfirmDelete={confirmDeleteEvent}
            onCloseEdit={closeEditDialog}
            onCloseDelete={closeDeleteDialog}
          />
        )}

        {canManageEvents && pendingDeleteEvent && (
          <div
            className="modal-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeDeleteDialog();
            }}
          >
            <section
              ref={modalDialogRef}
              className="event-modal delete-event-modal"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-event-title"
              aria-describedby="delete-event-description"
            >
              <div className="delete-modal-icon" aria-hidden="true">!</div>
              <h2 id="delete-event-title">Usunąć wydarzenie?</h2>
              <p id="delete-event-description">
                Czy na pewno chcesz usunąć <strong>{pendingDeleteEvent.title}</strong>? Tej
                operacji nie można cofnąć.
              </p>
              {error && <p className="modal-error" role="alert">{error}</p>}
              <div className="modal-actions">
                <button
                  ref={modalInitialFocusRef}
                  className="modal-secondary-btn"
                  type="button"
                  onClick={closeDeleteDialog}
                  disabled={saving}
                >
                  Anuluj
                </button>
                <button
                  className="modal-danger-btn"
                  type="button"
                  onClick={confirmDeleteEvent}
                  disabled={saving}
                >
                  {saving ? "Usuwanie..." : "Usuń"}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
