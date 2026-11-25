import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function useCalendarData(setError, onCategoriesLoaded) {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [schoolYearId, setSchoolYearId] = useState("");
  const [loading, setLoading] = useState(true);

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
          { data: loadedCategories, error: categoriesError },
        ]) => {
          if (!active) return;
          if (yearsError) throw yearsError;
          if (categoriesError) throw categoriesError;

          const nextSchoolYears = years || [];
          const nextCategories = loadedCategories || [];

          setSchoolYears(nextSchoolYears);
          setCategories(nextCategories);
          onCategoriesLoaded(nextCategories);
          setSchoolYearId((current) => {
            if (
              current &&
              nextSchoolYears.some((year) => String(year.id) === String(current))
            ) {
              return current;
            }

            const activeYear = nextSchoolYears.find((year) => year.is_active);
            return String((activeYear || nextSchoolYears[0])?.id ?? "");
          });
        },
      )
      .catch((error) => {
        if (active) setError(`Nie udało się pobrać danych: ${error.message}`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [onCategoriesLoaded, setError]);

  useEffect(() => {
    if (!schoolYearId) return undefined;

    let active = true;

    fetchEvents(schoolYearId).then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setError(`Nie udało się pobrać wydarzeń: ${error.message}`);
        return;
      }

      setEvents(data || []);
    });

    return () => {
      active = false;
    };
  }, [schoolYearId, fetchEvents, setError]);

  return {
    events,
    setEvents,
    categories,
    schoolYears,
    schoolYearId,
    setSchoolYearId,
    loading,
    fetchEvents,
  };
}
