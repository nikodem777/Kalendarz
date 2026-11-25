export const MONTHS = [
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

export const WEEKDAYS = [
  "Poniedziałek",
  "Wtorek",
  "Środa",
  "Czwartek",
  "Piątek",
  "Sobota",
  "Niedziela",
];

export const SHORT_WEEKDAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

const pad = (value) => String(value).padStart(2, "0");

export const dateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const getCalendarDays = (year, month) => {
  const first = new Date(year, month, 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
};

export const categoryClass = (name = "") => {
  const normalized = name.toLowerCase();

  if (normalized.includes("sprawdzian")) return "test";
  if (normalized.includes("wyciecz")) return "trip";
  if (
    normalized.includes("wolny") ||
    normalized.includes("święto") ||
    normalized.includes("swieto")
  ) {
    return "holiday";
  }

  return "event";
};
