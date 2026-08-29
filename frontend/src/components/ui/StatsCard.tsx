import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from './Card';

export const StatsCard: React.FC<{ title: string; value: string | number; icon: LucideIcon; change?: string; changeType?: 'up' | 'down'; color?: string }> = ({ title, value, icon: Icon, change, changeType, color = 'indigo' }) => (
  <Card>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h4 className="text-3xl font-bold text-gray-900 mt-2">{value}</h4>
        {change && (
          <p className={`text-sm mt-2 font-medium ${changeType === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {changeType === 'up' ? '↑' : '↓'} {change} from last month
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg bg-${color}-50 text-${color}-600`}>
        <Icon size={24} />
      </div>
    </div>
  </Card>
);

export default StatsCard;
