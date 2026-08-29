import React from 'react';

export const Card: React.FC<{ title?: string; subtitle?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }> = ({ title, subtitle, children, className = '', action }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
    {(title || action) && (
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <div>
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

export default Card;
