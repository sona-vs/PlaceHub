import React from 'react';
import { Search } from 'lucide-react';

export const SearchBar: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder = 'Search...' }) => (
  <div className="relative w-full max-w-md">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
      placeholder={placeholder}
    />
  </div>
);

export default SearchBar;
