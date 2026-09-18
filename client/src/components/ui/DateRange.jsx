export default function DateRange({ from, to, onFromChange, onToChange, fromLabel = 'С даты', toLabel = 'По дату' }) {
  return (
    <div className="filter-field date-range">
      <label>{fromLabel} / {toLabel}</label>
      <div className="date-range-inputs">
        <input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} />
        <input type="date" value={to} onChange={(e) => onToChange(e.target.value)} />
      </div>
    </div>
  );
}
