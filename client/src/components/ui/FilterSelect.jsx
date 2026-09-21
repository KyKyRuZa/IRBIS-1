import Dropdown from '@components/ui/Dropdown.jsx';

export default function FilterSelect({ label, value, onChange, children, className }) {
  return (
    <div className={`filter-field ${className || ''}`}>
      <label>{label}</label>
      <Dropdown value={value} onChange={onChange}>
        {children}
      </Dropdown>
    </div>
  );
}
