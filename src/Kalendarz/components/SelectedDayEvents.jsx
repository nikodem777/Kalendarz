export default function SelectedDayEvents({
  events,
  selectedDate,
  selectedDateLabel,
  canManageEvents,
  saving,
  onEdit,
  onDelete,
}) {
  return (
    <section className="selected-day-events" aria-live="polite">
      <div className="selected-day-heading">
        <h3>Wydarzenia: {selectedDateLabel}</h3>
        <span>{events.length}</span>
      </div>
      <ul className="selected-day-list">
        {events.map((event) => {
          const category = event.categories;
          const startsToday = event.start_date === selectedDate;

          return (
            <li
              className="selected-day-item"
              key={event.id}
              style={{ borderLeftColor: category?.color || "#dce5f1" }}
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
                        style={{ backgroundColor: category.color || "#8753c7" }}
                      />
                      {category.name}
                    </span>
                  )}
                </div>
              </div>
              {event.description && <p>{event.description}</p>}
              {canManageEvents && (
                <div className="event-item-actions">
                  <button type="button" onClick={() => onEdit(event)}>
                    Edytuj
                  </button>
                  <button
                    type="button"
                    className="delete-action"
                    onClick={() => onDelete(event)}
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
  );
}
