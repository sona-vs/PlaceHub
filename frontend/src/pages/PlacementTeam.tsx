import React, { useState, useEffect } from 'react';
import { Users, Plus, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { teamService } from '../services/teamService';
import { useAuth } from '../contexts/AuthContext';
import { PlacementTeamMember, Company } from '../types';

import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';

export default function PlacementTeam() {
  const { user } = useAuth();
  const [team, setTeam] = useState<PlacementTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  
  // Expand states
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const data = await teamService.getTeam();
      // If lead, filter to only show themselves or their team
      if (user?.role === 'lead') {
        setTeam(data.filter((m: any) => m._id === user._id || (m.user && m.user._id === user._id)));
      } else {
        setTeam(data);
      }
    } catch (error) {
      toast.error('Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await teamService.createMember({ ...formData, role: 'member' });
      toast.success('Team member added');
      setIsModalOpen(false);
      setFormData({ name: '', email: '' });
      fetchTeam();
    } catch (error) {
      toast.error('Failed to add team member');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedMember(expandedMember === id ? null : id);
  };

  const getStats = (companies: Company[] = []) => {
    const stats = {
      cold: 0, warm: 0, hot: 0, drive_completed: 0, offers: 0
    };
    companies.forEach(c => {
      if (c.status in stats) {
        stats[c.status as keyof typeof stats]++;
      }
      if (c.offersCount) stats.offers += c.offersCount;
    });
    return stats;
  };

  if (loading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Placement Team</h1>
        {user?.role === 'admin' && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Member
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {team.map(member => {
          const stats = getStats(member.assignedCompanies);
          const isExpanded = expandedMember === member._id;
          
          return (
            <Card key={member._id}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Mail className="w-3 h-3 mr-1" /> {member.email}
                  </div>
                </div>
                <Badge variant={member.role === 'admin' ? 'info' : 'default'}>
                  {member.role.toUpperCase()}
                </Badge>
              </div>

              <div className="py-4 border-t border-gray-100 grid grid-cols-5 gap-2 text-center mb-2">
                <div>
                  <div className="text-lg font-bold text-slate-700">{stats.cold}</div>
                  <div className="text-xs text-slate-500 uppercase">Cold</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-amber-600">{stats.warm}</div>
                  <div className="text-xs text-amber-500 uppercase">Warm</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600">{stats.hot}</div>
                  <div className="text-xs text-orange-500 uppercase">Hot</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-emerald-600">{stats.drive_completed}</div>
                  <div className="text-xs text-emerald-500 uppercase">Done</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-indigo-600">{stats.offers}</div>
                  <div className="text-xs text-indigo-500 uppercase">Offers</div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <button 
                  onClick={() => toggleExpand(member._id)}
                  className="flex items-center justify-between w-full text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  <span>Assigned Companies ({member.assignedCompanies?.length || 0})</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {isExpanded && (
                  <div className="mt-3 space-y-2">
                    {member.assignedCompanies && member.assignedCompanies.length > 0 ? (
                      member.assignedCompanies.map(company => (
                        <div key={company._id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                          <span className="font-medium text-gray-800">{company.name}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            company.status === 'hot' ? 'bg-orange-100 text-orange-700' :
                            company.status === 'warm' ? 'bg-amber-100 text-amber-700' :
                            company.status === 'drive_completed' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {company.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic">No companies assigned.</p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Team Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          <Input 
            label="Name" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            required 
          />
          <Input 
            label="Email" 
            type="email"
            value={formData.email} 
            onChange={e => setFormData({...formData, email: e.target.value})} 
            required 
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Member</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
