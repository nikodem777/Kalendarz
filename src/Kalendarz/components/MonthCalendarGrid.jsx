import { MONTHS, WEEKDAYS, categoryClass, dateKey } from "../calendarUtils";

export default function MonthCalendarGrid({
  days,
  viewMonth,
  viewYear,
  selectedDate,
  todayKey,
  eventsByDate,
  canManageEvents,
  onChooseDate,
  onEditEvent,
}) {
  return (
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

      {days.map((date) => {
        const key = dateKey(date);
        const isCurrentMonth = date.getMonth() === viewMonth;
        const isSelected = key === selectedDate;
        const isToday = key === todayKey;
        const dayEvents = eventsByDate.get(key) || [];

        return (
          <div
            role="gridcell"
            tabIndex={0}
            key={key}
            className={`day-cell ${isCurrentMonth ? "" : "outside"} ${
              isSelected ? "selected" : ""
            } ${isToday ? "today" : ""}`}
            onClick={() => onChooseDate(date)}
            onKeyDown={(event) => {
              if (
                event.target === event.currentTarget &&
                (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault();
                onChooseDate(date);
              }
            }}
            aria-label={`${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}${dayEvents.length ? `, ${dayEvents.length} wydarzeń` : ""}`}
          >
            <span className={`day-number ${isToday ? "today-number" : ""}`}>
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
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      if (canManageEvents) {
                        onEditEvent(event);
                      } else {
                        onChooseDate(date);
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
                <span className="more-events">Zobacz +{dayEvents.length - 2}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
