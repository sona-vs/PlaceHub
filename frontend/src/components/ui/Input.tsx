import React, { forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }>(({ label, error, className = '', ...props }, ref) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input
      ref={ref}
      className={`w-full rounded-lg border ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'} px-4 py-2 text-sm focus:outline-none focus:ring-2 ${className}`}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
));
Input.displayName = 'Input';

export default Input;
