export default function EventDialogs({
  editingEvent,
  pendingDeleteEvent,
  editForm,
  categories,
  error,
  saving,
  modalDialogRef,
  modalInitialFocusRef,
  onEditFieldChange,
  onEditDayModeChange,
  onEditStartDateChange,
  onSaveEdit,
  onConfirmDelete,
  onCloseEdit,
  onCloseDelete,
}) {
  return (
    <>
      {editingEvent && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onCloseEdit();
          }}
        >
          <section
            ref={modalDialogRef}
            className="event-modal edit-event-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-event-title"
          >
            <header className="event-modal-header">
              <div>
                <span className="event-modal-eyebrow">
                  Zarządzanie wydarzeniem
                </span>
                <h2 id="edit-event-title">Edytuj wydarzenie</h2>
                <p>{editingEvent.title}</p>
              </div>
              <button
                ref={modalInitialFocusRef}
                className="modal-close-btn"
                type="button"
                aria-label="Zamknij edycję"
                onClick={onCloseEdit}
                disabled={saving}
              >
                ×
              </button>
            </header>

            <form className="modal-form" onSubmit={onSaveEdit}>
              <label htmlFor="edit-event-name">
                Nazwa wydarzenia <span>*</span>
              </label>
              <input
                id="edit-event-name"
                value={editForm.title}
                onChange={(event) =>
                  onEditFieldChange("title", event.target.value)
                }
                required
              />

              <label htmlFor="edit-event-category">
                Kategoria <span>*</span>
              </label>
              <select
                id="edit-event-category"
                value={editForm.categoryId}
                onChange={(event) =>
                  onEditFieldChange("categoryId", event.target.value)
                }
                required
              >
                <option value="">Wybierz kategorię</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </select>

              <div className="form-toggle modal-form-toggle">
                <input
                  id="edit-single-day"
                  type="checkbox"
                  checked={editForm.singleDay}
                  onChange={(event) =>
                    onEditDayModeChange(event.target.checked)
                  }
                />
                <label htmlFor="edit-single-day">Wydarzenie jednodniowe</label>
              </div>

              <div className="date-row">
                <div>
                  <label htmlFor="edit-start-date">
                    {editForm.singleDay ? "Data" : "Data od"} <span>*</span>
                  </label>
                  <input
                    id="edit-start-date"
                    type="date"
                    value={editForm.startDate}
                    onChange={(event) =>
                      onEditStartDateChange(event.target.value)
                    }
                    required
                  />
                </div>
                {!editForm.singleDay && (
                  <div>
                    <label htmlFor="edit-end-date">
                      Data do <span>*</span>
                    </label>
                    <input
                      id="edit-end-date"
                      type="date"
                      value={editForm.endDate}
                      min={editForm.startDate || undefined}
                      onChange={(event) =>
                        onEditFieldChange("endDate", event.target.value)
                      }
                      required
                    />
                  </div>
                )}
              </div>

              {editForm.singleDay && (
                <div className="modal-time-fields">
                  <div className="form-toggle modal-form-toggle">
                    <input
                      id="edit-all-day"
                      type="checkbox"
                      checked={editForm.allDay}
                      onChange={(event) =>
                        onEditFieldChange("allDay", event.target.checked)
                      }
                    />
                    <label htmlFor="edit-all-day">Cały dzień</label>
                  </div>
                  {!editForm.allDay && (
                    <div>
                      <label htmlFor="edit-start-time">
                        Godzina rozpoczęcia <span>*</span>
                      </label>
                      <input
                        id="edit-start-time"
                        type="time"
                        value={editForm.startTime}
                        onChange={(event) =>
                          onEditFieldChange("startTime", event.target.value)
                        }
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              <label htmlFor="edit-description">Opis (opcjonalnie)</label>
              <textarea
                id="edit-description"
                value={editForm.description}
                onChange={(event) =>
                  onEditFieldChange("description", event.target.value)
                }
                placeholder="Dodaj szczegóły wydarzenia..."
                rows="3"
              />

              {error && <p className="modal-error" role="alert">{error}</p>}

              <div className="modal-actions">
                <button
                  className="modal-secondary-btn"
                  type="button"
                  onClick={onCloseEdit}
                  disabled={saving}
                >
                  Anuluj
                </button>
                <button
                  className="modal-primary-btn"
                  type="submit"
                  disabled={saving || categories.length === 0}
                >
                  {saving ? "Zapisywanie..." : "Zapisz zmiany"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {pendingDeleteEvent && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onCloseDelete();
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
            <div className="delete-modal-icon" aria-hidden="true">
              !
            </div>
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
                onClick={onCloseDelete}
                disabled={saving}
              >
                Anuluj
              </button>
              <button
                className="modal-danger-btn"
                type="button"
                onClick={onConfirmDelete}
                disabled={saving}
              >
                {saving ? "Usuwanie..." : "Usuń"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
