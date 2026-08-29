import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Plus, Eye, Edit, Trash2, Send, Check, X, 
  MapPin, UploadCloud, FileText, Users 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { companyService } from '../services/companyService';
import { Company } from '../types';

import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import SearchBar from '../components/ui/SearchBar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';

export default function Companies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [approvalFilter, setApprovalFilter] = useState('All');
  const [page, setPage] = useState(1);
  const itemsPerPage = 9;

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: '' });
  const [jdModal, setJdModal] = useState({ isOpen: false, id: '' });
  const [placementsModal, setPlacementsModal] = useState<{ isOpen: boolean, companyName: string, placements: any[], loading: boolean }>({ isOpen: false, companyName: '', placements: [], loading: false });

  // Form State
  const [formData, setFormData] = useState({
    name: '', location: '', googleMapsLink: '', website: '',
    hrName: '', hrEmail: '', hrMobile: '', companySize: 'Medium',
    jobDescription: '', ctc: '', status: 'cold',
    studentsAppeared: 0, studentsPlaced: 0, offersCount: 0
  });

  const [jdFile, setJdFile] = useState<File | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getCompanies();
      setCompanies(data);
    } catch (error) {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter.toLowerCase().replace(' ', '_');
      const matchesApproval = approvalFilter === 'All' || c.approvalStatus === approvalFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesApproval;
    });
  }, [companies, search, statusFilter, approvalFilter]);

  const paginatedCompanies = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredCompanies.slice(start, start + itemsPerPage);
  }, [filteredCompanies, page]);

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);

  const handleOpenModal = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        location: company.location || '',
        googleMapsLink: company.mapsLink || '',
        website: company.website || '',
        hrName: company.hrName,
        hrEmail: company.hrEmail,
        hrMobile: company.hrMobile || '',
        companySize: company.companySize || 'Medium',
        jobDescription: company.jobDescription || '',
        ctc: company.ctc.toString(),
        status: company.status,
        studentsAppeared: company.studentsAppeared || 0,
        studentsPlaced: company.studentsPlaced || 0,
        offersCount: company.offersCount || 0
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: '', location: '', googleMapsLink: '', website: '',
        hrName: '', hrEmail: '', hrMobile: '', companySize: 'Medium',
        jobDescription: '', ctc: '', status: 'cold',
        studentsAppeared: 0, studentsPlaced: 0, offersCount: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        location: formData.location,
        mapsLink: formData.googleMapsLink,
        website: formData.website,
        hrName: formData.hrName,
        hrEmail: formData.hrEmail,
        hrMobile: formData.hrMobile,
        companySize: formData.companySize,
        jobDescription: formData.jobDescription,
        status: formData.status,
        studentsAppeared: formData.studentsAppeared,
        studentsPlaced: formData.studentsPlaced,
        offersCount: formData.offersCount,
        ctc: Number(formData.ctc)
      };
      
      if (editingCompany) {
        await companyService.updateCompany(editingCompany._id, payload);
        toast.success('Company updated successfully');
      } else {
        await companyService.createCompany(payload);
        toast.success('Company created successfully');
      }
      setIsModalOpen(false);
      fetchCompanies();
    } catch (error) {
      toast.error(editingCompany ? 'Failed to update company' : 'Failed to create company');
    }
  };

  const handleDelete = async () => {
    try {
      await companyService.deleteCompany(deleteDialog.id);
      toast.success('Company deleted successfully');
      setDeleteDialog({ isOpen: false, id: '' });
      fetchCompanies();
    } catch (error) {
      toast.error('Failed to delete company');
    }
  };

  const handleForward = async (id: string) => {
    try {
      await companyService.forwardCompany(id);
      toast.success('Company forwarded to Admin for approval');
      fetchCompanies();
    } catch (error) {
      toast.error('Failed to forward company');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await companyService.approveCompany(id);
      toast.success('Company approved');
      fetchCompanies();
    } catch (error: any) {
      toast.error('Failed to approve: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReject = async (id: string) => {
    try {
      await companyService.rejectCompany(id);
      toast.success('Company rejected');
      fetchCompanies();
    } catch (error: any) {
      toast.error('Failed to reject: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await companyService.updateStatus(id, newStatus as any);
      toast.success('Status updated');
      fetchCompanies();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleJDUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdFile) return;
    try {
      await companyService.uploadJD(jdModal.id, jdFile);
      toast.success('JD uploaded successfully');
      setJdModal({ isOpen: false, id: '' });
      setJdFile(null);
      fetchCompanies();
    } catch (error) {
      toast.error('Failed to upload JD');
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'cold': return 'cold';
      case 'warm': return 'warm';
      case 'hot': return 'hot';
      case 'drive_completed': return 'completed';
      default: return 'default';
    }
  };

  const getApprovalBadgeVariant = (status: string) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'forwarded': return 'info';
      default: return 'default';
    }
  };

  const handleViewPlacements = async (company: Company) => {
    setPlacementsModal({ isOpen: true, companyName: company.name, placements: [], loading: true });
    try {
      const data = await companyService.getPlacements(company._id);
      setPlacementsModal({ isOpen: true, companyName: company.name, placements: data, loading: false });
    } catch (error) {
      toast.error('Failed to load placements');
      setPlacementsModal(prev => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
        {(user?.role === 'admin' || user?.role === 'lead' || user?.role === 'member') && (
          <Button onClick={() => handleOpenModal()} size="md">
            <Plus className="w-4 h-4 mr-2" /> Add Company
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search companies..." />
        </div>
        <Select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: 'All Status', value: 'All' },
            { label: 'Cold', value: 'Cold' },
            { label: 'Warm', value: 'Warm' },
            { label: 'Hot', value: 'Hot' },
            { label: 'Drive Completed', value: 'Drive Completed' }
          ]}
          label=""
        />
        <Select 
          value={approvalFilter} 
          onChange={(e) => setApprovalFilter(e.target.value)}
          options={[
            { label: 'All Approvals', value: 'All' },
            { label: 'Pending', value: 'Pending' },
            { label: 'Forwarded', value: 'Forwarded' },
            { label: 'Approved', value: 'Approved' },
            { label: 'Rejected', value: 'Rejected' }
          ]}
          label=""
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : filteredCompanies.length === 0 ? (
        <EmptyState icon={Building2} title="No companies found" description="Try adjusting your search or filters." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedCompanies.map(company => (
              <Card key={company._id}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{company.name}</h3>
                    {company.location && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {company.location}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge variant={getStatusBadgeVariant(company.status)}>
                      {company.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge variant={getApprovalBadgeVariant(company.approvalStatus)}>
                      {company.approvalStatus.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-6">
                  <p><span className="font-semibold text-gray-900">HR:</span> {company.hrName} ({company.hrEmail})</p>
                  <p><span className="font-semibold text-gray-900">CTC:</span> ₹{company.ctc} LPA</p>
                  {company.offersCount !== undefined && company.offersCount > 0 && (
                    <p><span className="font-semibold text-gray-900">Offers:</span> {company.offersCount}</p>
                  )}
                  {company.assignedMember?.name && (
                    <p><span className="font-semibold text-gray-900">Assigned To:</span> {company.assignedMember.name}</p>
                  )}
                  {company.jobDescription && (
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      <p className="font-semibold text-gray-900 text-xs mb-1">Job Description Snippet:</p>
                      <p className="text-xs line-clamp-3 text-gray-500">{company.jobDescription}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                  <Button variant="secondary" size="sm" onClick={() => handleOpenModal(company)}>
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  
                  <Button variant="secondary" size="sm" onClick={() => setJdModal({ isOpen: true, id: company._id })}>
                    <UploadCloud className="w-4 h-4 mr-1" /> JD
                  </Button>

                  {user?.role === 'lead' && company.approvalStatus === 'pending' && (
                    <Button variant="secondary" size="sm" onClick={() => handleForward(company._id)}>
                      <Send className="w-4 h-4 mr-1" /> Forward
                    </Button>
                  )}

                  {company.status === 'drive_completed' && (
                    <Button variant="secondary" size="sm" onClick={() => handleViewPlacements(company)}>
                      <Users className="w-4 h-4 mr-1" /> Placements
                    </Button>
                  )}

                  {user?.role === 'admin' && (company.approvalStatus === 'forwarded' || company.approvalStatus === 'pending') && (
                    <>
                      <Button variant="primary" size="sm" onClick={() => handleApprove(company._id)} className="bg-emerald-600 hover:bg-emerald-700">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleReject(company._id)} className="text-red-600 hover:text-red-700">
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}

                  {user?.role === 'admin' && (
                    <Button variant="secondary" size="sm" onClick={() => setDeleteDialog({ isOpen: true, id: company._id })} className="text-red-600 hover:text-red-700 border-red-200">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                
                {(user?.role === 'admin' || user?.role === 'lead' || user?.role === 'member') && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Select
                      label=""
                      value={company.status}
                      onChange={(e) => handleStatusChange(company._id, e.target.value)}
                      options={[
                        { label: 'Cold', value: 'cold' },
                        { label: 'Warm', value: 'warm' },
                        { label: 'Hot', value: 'hot' },
                        { label: 'Drive Completed', value: 'drive_completed' }
                      ]}
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* Edit/Add Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCompany ? "Edit Company" : "Add Company"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Company Name *" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <Input label="CTC (LPA) *" type="number" value={formData.ctc} onChange={(e) => setFormData({...formData, ctc: e.target.value})} required />
            <Input label="HR Name *" value={formData.hrName} onChange={(e) => setFormData({...formData, hrName: e.target.value})} required />
            <Input label="HR Email *" type="email" value={formData.hrEmail} onChange={(e) => setFormData({...formData, hrEmail: e.target.value})} required />
            <Input label="Location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
            <Input label="HR Mobile" value={formData.hrMobile} onChange={(e) => setFormData({...formData, hrMobile: e.target.value})} />
            <Input label="Website" value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} />
            <Select label="Company Size" value={formData.companySize} onChange={(e) => setFormData({...formData, companySize: e.target.value})} 
              options={[
                { label: 'Startup', value: 'Startup' },
                { label: 'Small', value: 'Small' },
                { label: 'Medium', value: 'Medium' },
                { label: 'Large', value: 'Large' },
                { label: 'Enterprise', value: 'Enterprise' }
              ]} 
            />
          </div>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 px-4 py-2 text-sm focus:outline-none"
              rows={4}
              value={formData.jobDescription}
              onChange={(e) => setFormData({...formData, jobDescription: e.target.value})}
              placeholder="Enter job description or upload via JD button..."
            />
          </div>
          
          {editingCompany && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Students Appeared" type="number" value={formData.studentsAppeared.toString()} onChange={(e) => setFormData({...formData, studentsAppeared: Number(e.target.value)})} />
              <Input label="Students Placed" type="number" value={formData.studentsPlaced.toString()} onChange={(e) => setFormData({...formData, studentsPlaced: Number(e.target.value)})} />
              <Input label="Offers Count" type="number" value={formData.offersCount.toString()} onChange={(e) => setFormData({...formData, offersCount: Number(e.target.value)})} />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      {/* JD Upload Modal */}
      <Modal isOpen={jdModal.isOpen} onClose={() => setJdModal({ isOpen: false, id: '' })} title="Upload Job Description" size="md">
        <form onSubmit={handleJDUpload} className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id="jd-file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setJdFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="jd-file" className="cursor-pointer flex flex-col items-center">
              <FileText className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">
                {jdFile ? jdFile.name : "Click to select or drag and drop"}
              </span>
              <span className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX up to 5MB</span>
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setJdModal({ isOpen: false, id: '' })}>Cancel</Button>
            <Button type="submit" disabled={!jdFile}>Upload</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={placementsModal.isOpen} onClose={() => setPlacementsModal({ isOpen: false, companyName: '', placements: [], loading: false })} title={`Placed Students - ${placementsModal.companyName}`} size="3xl">
        {placementsModal.loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : placementsModal.placements.length === 0 ? (
          <EmptyState icon={Users} title="No placements found" description="No students have been marked as selected for this drive yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">S.No</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Roll Number</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Student Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Department</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {placementsModal.placements.map((p, idx) => (
                  <tr key={p._id}>
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.student?.rollNumber}</td>
                    <td className="px-4 py-3 text-gray-900">{p.student?.name}</td>
                    <td className="px-4 py-3 text-gray-600"><Badge variant="info">{p.student?.department}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: '' })}
        onConfirm={handleDelete}
        title="Delete Company"
        message="Are you sure you want to delete this company? This action cannot be undone."
      />
    </div>
  );
}
