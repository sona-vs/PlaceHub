import React from 'react';
import { User, Settings as SettingsIcon, Shield, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';

export default function Settings() {
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Profile Information">
          <div className="flex items-center gap-6 mt-4">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 shrink-0">
              {user?.name ? getInitials(user.name) : <User className="w-8 h-8" />}
            </div>
            <div className="space-y-3 flex-1">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</label>
                <div className="text-sm font-medium text-gray-900 mt-1">{user?.name}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</label>
                <div className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {user?.email}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Role</label>
                <div className="mt-1 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  <span className="text-sm font-medium text-indigo-700 capitalize bg-indigo-50 px-2 py-0.5 rounded">
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Application Info">
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-3 text-gray-700">
              <SettingsIcon className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm font-medium">PlaceHub System Version</div>
                <div className="text-xs text-gray-500">1.0.0</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-gray-700">
              <Shield className="w-5 h-5 text-gray-400" />
              <div>
                <div className="text-sm font-medium">Environment</div>
                <div className="text-xs text-gray-500">Development</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
