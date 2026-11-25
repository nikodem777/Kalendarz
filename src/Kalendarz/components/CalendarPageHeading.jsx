export default function CalendarPageHeading({ schoolYearLabel }) {
  return (
    <section className="page-heading">
      <div>
        <h1>Twój szkolny kalendarz</h1>
        <p>
          Wszystkie ważne terminy w jednym miejscu. Wybierz miesiąc, aby
          zobaczyć szczegóły.
        </p>
      </div>
      <div className="page-heading-actions">
        <button
          type="button"
          className="outline-btn print-btn"
          onClick={() => window.print()}
        >
          Drukuj
        </button>
        <div className="school-year">
          Rok szkolny <strong>{schoolYearLabel}</strong>
        </div>
      </div>
    </section>
  );
}
