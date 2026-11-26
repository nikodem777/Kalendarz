import { useState } from "react";
import { supabase } from "../../supabaseClient";

export default function useEventActions({
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
}) {
  const [saving, setSaving] = useState(false);

  async function addEvent(event) {
    event.preventDefault();
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
      setError("Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.");
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

      const { error: insertError } = await supabase
        .from("events")
        .insert(payload);
      if (insertError) throw insertError;

      const { data: refreshedEvents, error: eventsError } =
        await fetchEvents(schoolYearId);
      if (eventsError) throw eventsError;

      setEvents(refreshedEvents || []);
      const [year, month] = form.startDate.split("-").map(Number);
      setViewYear(year);
      setViewMonth(month - 1);
      setIsMonthOverview(false);
      setSelectedDate(form.startDate);
      setForm((current) => ({
        ...current,
        title: "",
        endDate: form.startDate,
        singleDay: true,
        startTime: "10:00",
        allDay: false,
        description: "",
      }));
      setNotice("Wydarzenie zapisano w bazie Supabase.");
    } catch (error) {
      setError(
        error.code === "42501"
          ? "Brak uprawnień do dodawania wydarzeń. Sprawdź uprawnienia administratora w Supabase."
          : `Nie udało się zapisać wydarzenia: ${error.message}`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveEditedEvent(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const endDate = editForm.singleDay ? editForm.startDate : editForm.endDate;

    if (!editForm.title.trim() || !editForm.startDate || !endDate) {
      setError("Uzupełnij nazwę i datę wydarzenia.");
      return;
    }

    if (!editForm.categoryId) {
      setError("Wybierz kategorię wydarzenia.");
      return;
    }

    if (!schoolYearId) {
      setError("Nie wybrano roku szkolnego.");
      return;
    }

    if (!editForm.singleDay && endDate < editForm.startDate) {
      setError("Data zakończenia nie może być wcześniejsza niż data rozpoczęcia.");
      return;
    }

    if (
      activeSchoolYear &&
      (editForm.startDate < activeSchoolYear.start_date ||
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
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        start_date: editForm.startDate,
        end_date: endDate,
        start_time:
          editForm.singleDay && !editForm.allDay
            ? editForm.startTime || null
            : null,
        end_time: null,
        category_id: Number(editForm.categoryId),
        school_year_id: Number(schoolYearId),
      };

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

      const { data: refreshedEvents, error: eventsError } =
        await fetchEvents(schoolYearId);
      if (eventsError) throw eventsError;

      setEvents(refreshedEvents || []);
      const [year, month] = editForm.startDate.split("-").map(Number);
      setViewYear(year);
      setViewMonth(month - 1);
      setIsMonthOverview(false);
      setSelectedDate(editForm.startDate);
      setEditingEventId(null);
      setNotice("Zmiany wydarzenia zapisano.");
    } catch (error) {
      setError(
        error.code === "42501"
          ? "Brak uprawnień do edycji wydarzeń. Sprawdź uprawnienia administratora w Supabase."
          : `Nie udało się zaktualizować wydarzenia: ${error.message}`,
      );
    } finally {
      setSaving(false);
    }
  }

  function deleteEvent(event) {
    if (!canManageEvents) return;
    setError("");
    setPendingDeleteEvent(event);
  }

  async function confirmDeleteEvent() {
    if (!canManageEvents || !schoolYearId || !pendingDeleteEvent) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const { data: deletedEvent, error: deleteError } = await supabase
        .from("events")
        .delete()
        .eq("id", pendingDeleteEvent.id)
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
      if (String(editingEventId) === String(pendingDeleteEvent.id)) {
        setEditingEventId(null);
      }
      setPendingDeleteEvent(null);
      setNotice("Wydarzenie usunięto.");
    } catch (error) {
      setError(`Nie udało się usunąć wydarzenia: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  return { saving, addEvent, saveEditedEvent, deleteEvent, confirmDeleteEvent };
}
