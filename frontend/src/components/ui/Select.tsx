import React, { forwardRef } from 'react';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; options: {value: string; label: string}[] }>(({ label, error, options, className = '', ...props }, ref) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <select
      ref={ref}
      className={`w-full rounded-lg border ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'} px-4 py-2 text-sm focus:outline-none focus:ring-2 bg-white ${className}`}
      {...props}
    >
      <option value="">Select an option</option>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
));
Select.displayName = 'Select';

export default Select;
