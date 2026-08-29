import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, GraduationCap, Building2, FileSearch, BarChart3, Users, Bell, Settings, LogOut } from 'lucide-react';

export const Sidebar = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/students', icon: GraduationCap },
    { name: 'Companies', path: '/companies', icon: Building2 },
    { name: 'Recruiters / ATS', path: '/ats', icon: FileSearch, roles: ['admin', 'lead'] },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Placement Team', path: '/team', icon: Users },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const filteredNavItems = navItems.filter(item => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-200 fixed left-0 top-0 flex flex-col hidden md:flex">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-indigo-600">PlaceHub</h1>
        <p className="text-xs text-gray-400 mt-1">Smart Placement</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <item.icon size={20} />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
            {user?.name.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 truncate w-32">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
        <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
};
