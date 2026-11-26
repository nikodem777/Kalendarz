import { useState } from "react";

export default function EventForm({
  form,
  categories,
  saving,
  onSubmit,
  onUpdateField,
  onCategoryChange,
  onChooseCategory,
  onStartDateChange,
}) {
  const [categorySuggestionsOpen, setCategorySuggestionsOpen] = useState(false);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(-1);
  const filteredCategories = categories.filter((category) =>
    category.name
      .toLocaleLowerCase()
      .includes(form.categoryName.trim().toLocaleLowerCase()),
  );

  function selectCategory(category) {
    onChooseCategory(category);
    setCategorySuggestionsOpen(false);
    setActiveCategoryIndex(-1);
  }

  return (
    <aside className="form-card">
      <div className="form-heading">
        <div className="form-heading-icon">▣</div>
        <h2>Dodaj wydarzenie</h2>
      </div>

      <p className="form-intro">
        Uzupełnij dane i zapisz nowy termin w kalendarzu.
      </p>

      <form onSubmit={onSubmit}>
        <label htmlFor="event-title">
          Nazwa wydarzenia <span>*</span>
        </label>
        <input
          id="event-title"
          value={form.title}
          onChange={(event) => onUpdateField("title", event.target.value)}
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
            onChange={(event) => {
              onCategoryChange(event.target.value);
              setCategorySuggestionsOpen(true);
              setActiveCategoryIndex(-1);
            }}
            onFocus={() => setCategorySuggestionsOpen(true)}
            onBlur={() => setCategorySuggestionsOpen(false)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setCategorySuggestionsOpen(true);
                setActiveCategoryIndex((current) =>
                  Math.min(current + 1, filteredCategories.length - 1),
                );
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveCategoryIndex((current) => Math.max(current - 1, -1));
              } else if (event.key === "Escape") {
                setCategorySuggestionsOpen(false);
                setActiveCategoryIndex(-1);
              } else if (
                event.key === "Enter" &&
                categorySuggestionsOpen &&
                filteredCategories[activeCategoryIndex]
              ) {
                event.preventDefault();
                selectCategory(filteredCategories[activeCategoryIndex]);
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
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectCategory(category)}
                  >
                    <i
                      style={{ backgroundColor: category.color || "#8753c7" }}
                      aria-hidden="true"
                    />
                    {category.name}
                  </button>
                ))
              ) : (
                <div className="category-empty">Brak pasujących kategorii</div>
              )}
            </div>
          )}
        </div>

        <div className="form-toggle">
          <input
            id="single-day-event"
            type="checkbox"
            checked={form.singleDay}
            onChange={(event) => {
              const singleDay = event.target.checked;
              onUpdateField("singleDay", singleDay);
              onUpdateField("endDate", singleDay ? form.startDate : "");
            }}
          />
          <label htmlFor="single-day-event">Wydarzenie jednodniowe</label>
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
              onChange={(event) => onStartDateChange(event.target.value)}
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
                onChange={(event) =>
                  onUpdateField("endDate", event.target.value)
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
                onChange={(event) =>
                  onUpdateField("allDay", event.target.checked)
                }
              />
              <label htmlFor="all-day-event">Wydarzenie całodniowe</label>
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
                  onChange={(event) =>
                    onUpdateField("startTime", event.target.value)
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
          onChange={(event) => onUpdateField("description", event.target.value)}
          placeholder="Dodaj szczegóły wydarzenia..."
          rows="3"
        />

        <div className="event-form-actions">
          <button
            className="submit-btn"
            type="submit"
            disabled={saving || categories.length === 0}
          >
            <span>＋</span>
            {saving ? "Zapisywanie..." : "Dodaj wydarzenie"}
          </button>
        </div>

        {categories.length === 0 && (
          <p className="required-note">
            Najpierw dodaj kategorie w tabeli categories.
          </p>
        )}

        <p className="required-note">* Pola wymagane</p>
      </form>
    </aside>
  );
}
