const fs = require('fs');
const path = require('path');

const files = {
  'src/contexts/AuthContext.tsx': `import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email?: string, password?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email?: string, password?: string) => {
    const data = await authService.login(email, password);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
`,
  'src/components/ProtectedRoute.tsx': `import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
};
`,
  'src/components/layout/Sidebar.tsx': `import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, GraduationCap, Building2, FileSearch, BarChart3, Users, Bell, Settings, LogOut } from 'lucide-react';

export const Sidebar = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/students', icon: GraduationCap, roles: ['admin', 'manager'] },
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
            className={({ isActive }) => \`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors \${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}\`}
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
`,
  'src/components/layout/TopNav.tsx': `import React from 'react';
import { Menu, Search, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const TopNav = () => {
  const { user } = useAuth();
  
  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-gray-500 hover:text-gray-700">
          <Menu size={24} />
        </button>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64" />
        </div>
        
        <button className="relative text-gray-500 hover:text-gray-700">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
      </div>
    </div>
  );
};
`,
  'src/components/layout/Layout.tsx': `import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

export const Layout = () => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
`,
  'src/components/ui/Card.tsx': `import React from 'react';

export const Card: React.FC<{ title?: string; subtitle?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }> = ({ title, subtitle, children, className = '', action }) => (
  <div className={\`bg-white rounded-xl shadow-sm border border-gray-200 \${className}\`}>
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
`,
  'src/components/ui/StatsCard.tsx': `import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from './Card';

export const StatsCard: React.FC<{ title: string; value: string | number; icon: LucideIcon; change?: string; changeType?: 'up' | 'down'; color?: string }> = ({ title, value, icon: Icon, change, changeType, color = 'indigo' }) => (
  <Card>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h4 className="text-3xl font-bold text-gray-900 mt-2">{value}</h4>
        {change && (
          <p className={\`text-sm mt-2 font-medium \${changeType === 'up' ? 'text-green-600' : 'text-red-600'}\`}>
            {changeType === 'up' ? '↑' : '↓'} {change} from last month
          </p>
        )}
      </div>
      <div className={\`p-3 rounded-lg bg-\${color}-50 text-\${color}-600\`}>
        <Icon size={24} />
      </div>
    </div>
  </Card>
);
`,
  'src/components/ui/Badge.tsx': `import React from 'react';

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
  <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${variants[variant]} \${className}\`}>
    {children}
  </span>
);
`,
  'src/components/ui/Button.tsx': `import React from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; size?: 'sm' | 'md' | 'lg'; loading?: boolean }> = ({ variant = 'primary', size = 'md', loading, children, className = '', ...props }) => {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button className={\`\${base} \${variants[variant]} \${sizes[size]} \${className}\`} disabled={loading || props.disabled} {...props}>
      {loading ? <span className="mr-2 animate-spin rounded-full h-4 w-4 border-b-2 border-current"></span> : null}
      {children}
    </button>
  );
};
`,
  'src/components/ui/Input.tsx': `import React, { forwardRef } from 'react';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }>(({ label, error, className = '', ...props }, ref) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input
      ref={ref}
      className={\`w-full rounded-lg border \${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'} px-4 py-2 text-sm focus:outline-none focus:ring-2 \${className}\`}
      {...props}
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
));
Input.displayName = 'Input';
`,
  'src/components/ui/Select.tsx': `import React, { forwardRef } from 'react';

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string; options: {value: string; label: string}[] }>(({ label, error, options, className = '', ...props }, ref) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <select
      ref={ref}
      className={\`w-full rounded-lg border \${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'} px-4 py-2 text-sm focus:outline-none focus:ring-2 bg-white \${className}\`}
      {...props}
    >
      <option value="">Select an option</option>
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
));
Select.displayName = 'Select';
`,
  'src/components/ui/DataTable.tsx': `import React from 'react';

export const DataTable: React.FC<{ columns: any[]; data: any[]; loading?: boolean }> = ({ columns, data, loading }) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {columns.map((col, i) => (
            <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {loading ? (
          <tr><td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td></tr>
        ) : data.length === 0 ? (
          <tr><td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">No data found</td></tr>
        ) : (
          data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map((col, j) => (
                <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);
`,
  'src/pages/Login.tsx': `import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2 flex items-center justify-center gap-2">
            <span className="text-4xl">✨</span> PlaceHub
          </h1>
          <p className="text-gray-500">Smart Placement Management System</p>
        </div>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="admin@placehub.com" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input required type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full mt-6" size="lg" loading={loading}>Sign In</Button>
        </form>
      </div>
    </div>
  );
}
`,
  'src/pages/Dashboard.tsx': `import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';
import { StatsCard } from '../components/ui/StatsCard';
import { Card } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { GraduationCap, Building2, UserCheck, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>Error loading stats</div>;

  const COLORS = ['#4F46E5', '#EC4899', '#9CA3AF'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Students" value={stats.totalStudents} icon={GraduationCap} color="indigo" />
        <StatsCard title="Total Companies" value={stats.totalCompanies} icon={Building2} color="blue" />
        <StatsCard title="Students Placed" value={stats.totalPlaced} icon={UserCheck} color="emerald" />
        <StatsCard title="Placement %" value={\`\${stats.placementPercentage}%\`} icon={TrendingUp} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Department Strength">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.departmentStrength}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card title="Gender Distribution">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.genderDistribution} dataKey="count" nameKey="_id" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {stats.genderDistribution.map((entry: any, index: number) => (
                    <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Academic Distribution (UG %)">
        <div className="h-64 flex items-end justify-between gap-2 px-4">
          {Object.entries(stats.academicBrackets).map(([key, value]: any) => (
            <div key={key} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">{value}</span>
              <div className="w-full bg-indigo-600 rounded-t-sm" style={{ height: \`\${Math.max((value / stats.totalStudents) * 200, 4)}px\` }}></div>
              <span className="text-xs text-gray-600 font-medium truncate">{key.replace('_', '-')}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Placement Team Overview">
        <DataTable
          columns={[
            { key: 'name', label: 'Member Name' },
            { key: 'cold', label: 'Cold', render: (r: any) => <Badge variant="cold">{r.cold}</Badge> },
            { key: 'warm', label: 'Warm', render: (r: any) => <Badge variant="warm">{r.warm}</Badge> },
            { key: 'hot', label: 'Hot', render: (r: any) => <Badge variant="hot">{r.hot}</Badge> },
            { key: 'drive_completed', label: 'Completed', render: (r: any) => <Badge variant="completed">{r.drive_completed}</Badge> },
            { key: 'totalOffers', label: 'Total Offers' },
          ]}
          data={stats.teamStats}
        />
      </Card>
    </div>
  );
}
`,
  'src/pages/Students.tsx': `import React, { useEffect, useState } from 'react';
import { studentService } from '../services/studentService';
import { Card } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Link } from 'react-router-dom';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await studentService.getStudents();
        setStudents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <div className="space-x-3">
          <Button variant="secondary">Import from Excel</Button>
          <Button>Add Student</Button>
        </div>
      </div>

      <Card>
        <div className="flex gap-4 mb-6">
          <Input placeholder="Search students..." className="max-w-xs" />
        </div>
        <DataTable
          loading={loading}
          columns={[
            { key: 'rollNumber', label: 'Roll Number' },
            { key: 'name', label: 'Name' },
            { key: 'department', label: 'Department' },
            { key: 'ugPercentage', label: 'UG %' },
            { key: 'placementStatus', label: 'Status', render: (r: any) => <Badge variant={r.placementStatus === 'placed' ? 'success' : 'default'}>{r.placementStatus}</Badge> },
            { key: 'actions', label: 'Actions', render: (r: any) => <Link to={\`/students/\${r._id}\`} className="text-indigo-600 hover:underline">View</Link> },
          ]}
          data={students}
        />
      </Card>
    </div>
  );
}
`,
  'src/pages/StudentProfile.tsx': `import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentService } from '../services/studentService';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      if (id) {
        try {
          const data = await studentService.getStudent(id);
          setStudent(data);
        } catch (err) {
          console.error(err);
        }
      }
    };
    fetchStudent();
  }, [id]);

  if (!student) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Link to="/students"><Button variant="secondary">← Back to Students</Button></Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 text-center">
          <div className="w-24 h-24 bg-indigo-100 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-indigo-600 mb-4">
            {student.name.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
          <p className="text-gray-500 mb-2">{student.rollNumber}</p>
          <Badge>{student.department}</Badge>
          <div className="mt-4">
            <Badge variant={student.placementStatus === 'placed' ? 'success' : 'default'}>{student.placementStatus.toUpperCase()}</Badge>
          </div>
        </Card>
        
        <div className="col-span-2 space-y-6">
          <Card title="Personal Information">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">Gender</p><p className="font-medium">{student.gender}</p></div>
              <div><p className="text-sm text-gray-500">Graduation Year</p><p className="font-medium">{student.graduationYear}</p></div>
              <div><p className="text-sm text-gray-500">Hostel Status</p><p className="font-medium">{student.hostelStatus}</p></div>
            </div>
          </Card>
          
          <Card title="Academic Information">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-sm text-gray-500">SSLC %</p><p className="font-bold text-lg">{student.sslcPercentage}%</p></div>
              <div><p className="text-sm text-gray-500">HSC %</p><p className="font-bold text-lg">{student.hscPercentage}%</p></div>
              <div><p className="text-sm text-gray-500">UG %</p><p className="font-bold text-lg">{student.ugPercentage}%</p></div>
              {student.pgPercentage && <div><p className="text-sm text-gray-500">PG %</p><p className="font-bold text-lg">{student.pgPercentage}%</p></div>}
            </div>
          </Card>
          
          <Card title="Contact & Links">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">Email</p><a href={\`mailto:\${student.email}\`} className="text-indigo-600 hover:underline">{student.email}</a></div>
              <div><p className="text-sm text-gray-500">Mobile</p><a href={\`tel:\${student.mobile}\`} className="text-indigo-600 hover:underline">{student.mobile}</a></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
`,
  'src/App.tsx': `import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentProfile from './pages/StudentProfile';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/access-denied" element={<div className="p-8 text-center"><h1 className="text-2xl text-red-600">Access Denied</h1><a href="/" className="text-indigo-600 mt-4 inline-block">Go Home</a></div>} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentProfile />} />
            <Route path="/companies" element={<div className="p-4">Companies Page Placeholder</div>} />
            <Route path="/ats" element={<div className="p-4">ATS Page Placeholder</div>} />
            <Route path="/reports" element={<div className="p-4">Reports Page Placeholder</div>} />
            <Route path="/team" element={<div className="p-4">Team Page Placeholder</div>} />
            <Route path="/notifications" element={<div className="p-4">Notifications Page Placeholder</div>} />
            <Route path="/settings" element={<div className="p-4">Settings Page Placeholder</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
`,
  'src/main.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
};

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
  console.log('Created', fullPath);
}
