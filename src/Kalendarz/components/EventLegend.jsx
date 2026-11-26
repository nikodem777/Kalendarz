export default function EventLegend({ categories }) {
  return (
    <div className="legend">
      <strong>Legenda</strong>
      {categories.map((category) => (
        <span className="legend-item" key={category.id}>
          <i style={{ backgroundColor: category.color || "#8753c7" }} />
          {category.name}
        </span>
      ))}
    </div>
  );
}
