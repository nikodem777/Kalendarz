import { MONTHS } from "../calendarUtils";

export default function CalendarToolbar({
  isMonthOverview,
  viewYear,
  setViewYear,
  calendarYears,
  viewMonth,
  setViewMonth,
  yearEventCount,
  monthEventCount,
  onReturnToYear,
  onToday,
  onChangeMonth,
}) {
  return (
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
            : `${monthEventCount} wydarzeń w tym miesiącu`}
        </p>
      </div>

      <div className="calendar-controls">
        {!isMonthOverview && (
          <button
            type="button"
            className="outline-btn overview-return"
            onClick={onReturnToYear}
          >
            ← 12 miesięcy
          </button>
        )}

        <select
          aria-label="Wybierz rok"
          value={viewYear}
          onChange={(event) => setViewYear(Number(event.target.value))}
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
              className="outline-btn"
              onClick={onToday}
            >
              Dzisiaj
            </button>
            <select
              aria-label="Wybierz miesiąc"
              value={viewMonth}
              onChange={(event) => setViewMonth(Number(event.target.value))}
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
              onClick={() => onChangeMonth(-1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="arrow-btn"
              aria-label="Następny miesiąc"
              onClick={() => onChangeMonth(1)}
            >
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}
