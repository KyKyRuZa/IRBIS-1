export default function FilterSelect({ label, value, onChange, children, className }) {
  return (
    <div className={`filter-field ${className || ''}`}>
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  );
}
