import React from 'react';
import { Select } from './Select';

interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  value: string;
}

export const FilterPanel: React.FC<{ filters: FilterOption[]; onFilterChange: (key: string, val: string) => void }> = ({ filters, onFilterChange }) => (
  <div className="flex flex-wrap gap-4 items-end">
    {filters.map(f => (
      <div key={f.key} className="w-48">
        <Select label={f.label} options={f.options} value={f.value} onChange={(e) => onFilterChange(f.key, e.target.value)} />
      </div>
    ))}
  </div>
);

export default FilterPanel;
