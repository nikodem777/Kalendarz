import {
  MONTHS,
  SHORT_WEEKDAYS,
  dateKey,
  getCalendarDays,
} from "../calendarUtils";

export default function MonthOverview({ year, eventsByDate, todayKey, onSelectMonth }) {
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
          <section
            className="month-overview-card"
            key={month}
            role="button"
            tabIndex={0}
            aria-label={`Otwórz ${month} ${year}`}
            onClick={() => onSelectMonth(monthIndex)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectMonth(monthIndex);
              }
            }}
          >
            <div className="month-overview-title">
              <strong>{month}</strong>
              <span>{monthEventIds.size} wydarzeń</span>
            </div>
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
                        ? dayEvents.map((event) => event.title).join(" · ")
                        : undefined
                    }
                  >
                    <span className="mini-day-number">{date.getDate()}</span>
                    {dayEvents.length > 0 && (
                      <span className="mini-day-events">
                        {dayEvents.slice(0, 2).map((event) => (
                          <span
                            className="mini-day-event"
                            key={event.id}
                            style={{
                              "--mini-event-color":
                                event.categories?.color || "#8753c7",
                            }}
                          >
                            {event.title}
                          </span>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="mini-day-more">
                            +{dayEvents.length - 2}
                          </span>
                        )}
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
