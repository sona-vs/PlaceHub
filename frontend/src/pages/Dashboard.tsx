import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';
import { StatsCard } from '../components/ui/StatsCard';
import { Card } from '../components/ui/Card';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { GraduationCap, Building2, UserCheck, TrendingUp, MapPin, Globe, Mail, Phone, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

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

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;
  if (!stats) return <div className="p-8 text-center text-red-500">Error loading stats</div>;

  const COLORS = ['#4F46E5', '#EC4899', '#9CA3AF'];

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'cold': return 'cold';
      case 'warm': return 'warm';
      case 'hot': return 'hot';
      case 'drive_completed': return 'completed';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Students" value={stats.totalStudents} icon={GraduationCap} color="indigo" />
        <StatsCard title="Total Companies" value={stats.totalCompanies} icon={Building2} color="blue" />
        <StatsCard title="Students Placed" value={stats.totalPlaced} icon={UserCheck} color="emerald" />
        <StatsCard title="Placement %" value={`${stats.placementPercentage}%`} icon={TrendingUp} color="amber" />
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
              <div className="w-full bg-indigo-600 rounded-t-sm" style={{ height: `${Math.max((value / stats.totalStudents) * 200, 4)}px` }}></div>
              <span className="text-xs text-gray-600 font-medium truncate">{key.replace('_', '-')}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Placement Team Overview">
        <DataTable
          columns={[
            { key: 'name', label: 'Member Name' },
            { 
              key: 'totalCompanies', 
              label: 'Total Companies', 
              render: (r: any) => (
                <button 
                  onClick={() => setSelectedMember(r)} 
                  className="text-indigo-600 font-semibold hover:underline bg-indigo-50 px-3 py-1 rounded-full transition-colors hover:bg-indigo-100"
                >
                  {r.totalCompanies} Companies
                </button>
              ) 
            },
            { key: 'cold', label: 'Cold', render: (r: any) => <Badge variant="cold">{r.cold}</Badge> },
            { key: 'warm', label: 'Warm', render: (r: any) => <Badge variant="warm">{r.warm}</Badge> },
            { key: 'hot', label: 'Hot', render: (r: any) => <Badge variant="hot">{r.hot}</Badge> },
            { key: 'drive_completed', label: 'Completed', render: (r: any) => <Badge variant="completed">{r.drive_completed}</Badge> },
            { key: 'totalOffers', label: 'Total Offers' },
          ]}
          data={stats.teamStats}
        />
      </Card>

      {/* Member's Companies Modal */}
      <Modal isOpen={!!selectedMember} onClose={() => setSelectedMember(null)} title={`${selectedMember?.name}'s Assigned Companies`} size="4xl">
        {selectedMember?.companies && selectedMember.companies.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Company Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Uploaded Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Registered</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Appeared</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Placed</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Offers</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">CTC (LPA)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selectedMember.companies.map((c: any) => (
                  <tr key={c._id} className="hover:bg-indigo-50/50 cursor-pointer transition-colors" onClick={() => setSelectedCompany(c)}>
                    <td className="px-4 py-3 font-semibold text-gray-900">{c.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(c.status)}>
                        {c.status?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.createdAt ? format(new Date(c.createdAt), 'MMM d, yyyy') : 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.registeredStudents || 0}</td>
                    <td className="px-4 py-3 text-gray-600">{c.studentsAppeared || 0}</td>
                    <td className="px-4 py-3 text-gray-600">{c.studentsPlaced || 0}</td>
                    <td className="px-4 py-3 text-gray-600">{c.offersCount || 0}</td>
                    <td className="px-4 py-3 text-gray-600 font-medium">₹{c.ctc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No companies assigned to this member.</div>
        )}
      </Modal>

      {/* Complete Company Details Modal */}
      <Modal isOpen={!!selectedCompany} onClose={() => setSelectedCompany(null)} title={`Company Details: ${selectedCompany?.name}`} size="3xl">
        {selectedCompany && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{selectedCompany.name}</h3>
                  <div className="space-y-3 text-sm">
                    {selectedCompany.location && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                        {selectedCompany.location}
                        {selectedCompany.mapsLink && (
                          <a href={selectedCompany.mapsLink} target="_blank" rel="noreferrer" className="ml-2 text-indigo-600 hover:underline">View Map</a>
                        )}
                      </div>
                    )}
                    {selectedCompany.website && (
                      <div className="flex items-center text-gray-600">
                        <Globe className="w-4 h-4 mr-3 text-gray-400" />
                        <a href={selectedCompany.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{selectedCompany.website}</a>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <Building2 className="w-4 h-4 mr-3 text-gray-400" />
                      Size: <span className="ml-1 font-medium text-gray-900">{selectedCompany.companySize || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                      Uploaded: <span className="ml-1 font-medium text-gray-900">{selectedCompany.createdAt ? format(new Date(selectedCompany.createdAt), 'MMM d, yyyy') : 'N/A'}</span>
                      {selectedCompany.createdBy?.name && <span className="ml-1 text-gray-500">by {selectedCompany.createdBy.name}</span>}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">HR Contact Details</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-900 font-medium">{selectedCompany.hrName || 'N/A'}</p>
                    <div className="flex items-center text-gray-600">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {selectedCompany.hrEmail || 'N/A'}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {selectedCompany.hrMobile || 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <h4 className="text-xs font-semibold text-indigo-800 uppercase tracking-wider mb-3">Drive Metrics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-indigo-600 text-xs mb-1">CTC</p>
                      <p className="font-bold text-indigo-900 text-lg">₹{selectedCompany.ctc || 0} LPA</p>
                    </div>
                    <div>
                      <p className="text-indigo-600 text-xs mb-1">Total Offers</p>
                      <p className="font-bold text-indigo-900 text-lg">{selectedCompany.offersCount || 0}</p>
                    </div>
                    <div>
                      <p className="text-indigo-600 text-xs mb-1">Registered</p>
                      <p className="font-semibold text-indigo-900">{selectedCompany.registeredStudents || 0}</p>
                    </div>
                    <div>
                      <p className="text-indigo-600 text-xs mb-1">Appeared / Placed</p>
                      <p className="font-semibold text-indigo-900">{selectedCompany.studentsAppeared || 0} / {selectedCompany.studentsPlaced || 0}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Job Description</h4>
                  <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap max-h-48 overflow-y-auto border border-gray-100">
                    {selectedCompany.jobDescription || 'No job description available.'}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                    Current Status: 
                    <div className="ml-3"><Badge variant={getStatusBadgeVariant(selectedCompany.status)}>{selectedCompany.status?.replace('_', ' ').toUpperCase()}</Badge></div>
                  </h4>
                  
                  {selectedCompany.statusHistory && selectedCompany.statusHistory.length > 0 ? (
                    <div className="relative pl-4 border-l-2 border-gray-200 space-y-6 mt-4 ml-2">
                      {selectedCompany.statusHistory.map((history: any, idx: number) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white"></div>
                          <p className="text-sm font-semibold text-gray-900 capitalize">{history.status?.replace('_', ' ')}</p>
                          <div className="flex items-center text-xs text-gray-500 mt-1 space-x-2">
                            <span>{format(new Date(history.changedAt), 'MMM d, yyyy h:mm a')}</span>
                            {history.changedBy?.name && (
                              <>
                                <span>•</span>
                                <span>by {history.changedBy.name}</span>
                              </>
                            )}
                          </div>
                          {history.note && <p className="text-xs text-gray-600 mt-1 italic">"{history.note}"</p>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No status history recorded.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
