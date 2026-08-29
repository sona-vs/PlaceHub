import React from 'react';

const variants = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  cold: 'bg-slate-100 text-slate-700',
  warm: 'bg-amber-100 text-amber-700',
  hot: 'bg-orange-100 text-orange-700',
  completed: 'bg-emerald-100 text-emerald-700',
};

export const Badge: React.FC<{ variant?: keyof typeof variants; children: React.ReactNode; className?: string }> = ({ variant = 'default', children, className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
    {children}
  </span>
);

export default Badge;
