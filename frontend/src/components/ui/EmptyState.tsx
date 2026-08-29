import React from 'react';
import { LucideIcon } from 'lucide-react';

export const EmptyState: React.FC<{ icon: LucideIcon; title: string; description: string; action?: React.ReactNode }> = ({ icon: Icon, title, description, action }) => (
  <div className="text-center p-12">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 text-gray-400">
      <Icon size={32} />
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
    <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">{description}</p>
    {action && <div>{action}</div>}
  </div>
);

export default EmptyState;
