import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Plus, Upload, Eye, Edit, Trash2, Download, FileSpreadsheet, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { studentService } from '../services/studentService';
import { Student } from '../types';
import { Card } from '../components/ui/Card';
import { StatsCard } from '../components/ui/StatsCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

const DEPARTMENTS = ['CSE','ECE','EEE','MECH','CIVIL','IT','AIDS','AIML','CSM','CSD'];
const GENDERS = ['Male','Female','Other'];
const HOSTEL_OPTIONS = ['Hosteller','Day Scholar'];

const emptyForm = {
  rollNumber:'', name:'', department:'CSE', gender:'Male', hostelStatus:'Hosteller',
  sslcPercentage:'', hscPercentage:'', ugPercentage:'', pgPercentage:'',
  graduationYear:'2025', email:'', mobile:'', github:'', linkedin:'',
  resumeUrl:'', portfolioUrl:'', photoUrl:'', skills:''
};

export default function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [hostelFilter, setHostelFilter] = useState('');
  
  // Modals
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  
  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  
  // Import
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.search = search;
      if (deptFilter) params.department = deptFilter;
      if (genderFilter) params.gender = genderFilter;
      if (hostelFilter) params.hostelStatus = hostelFilter;
      const res = await studentService.getStudents(params);
      setStudents(res.data || res);
      setTotal(res.total || (res.data || res).length);
      setTotalPages(res.pages || 1);
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, search, deptFilter, genderFilter, hostelFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const openAdd = () => { setEditingStudent(null); setFormData(emptyForm); setShowAddEdit(true); };
  const openEdit = (s: Student) => {
    setEditingStudent(s);
    setFormData({
      rollNumber: s.rollNumber, name: s.name, department: s.department,
      gender: s.gender || 'Male', hostelStatus: s.hostelStatus || 'Hosteller',
      sslcPercentage: String(s.sslcPercentage || ''), hscPercentage: String(s.hscPercentage || ''),
      ugPercentage: String(s.ugPercentage || ''), pgPercentage: String(s.pgPercentage || ''),
      graduationYear: String(s.graduationYear || '2025'), email: s.email || '',
      mobile: s.mobile || '', github: s.github || '', linkedin: s.linkedin || '',
      resumeUrl: s.resumeUrl || '', portfolioUrl: s.portfolioUrl || '',
      photoUrl: s.photoUrl || '', skills: (s.skills || []).join(', ')
    });
    setShowAddEdit(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rollNumber || !formData.name || !formData.department) {
      toast.error('Roll Number, Name, and Department are required'); return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Invalid email format'); return;
    }
    if (formData.mobile && !/^[6-9]\d{9}$/.test(formData.mobile)) {
      toast.error('Mobile must be a valid 10-digit Indian number'); return;
    }
    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        sslcPercentage: formData.sslcPercentage ? Number(formData.sslcPercentage) : undefined,
        hscPercentage: formData.hscPercentage ? Number(formData.hscPercentage) : undefined,
        ugPercentage: formData.ugPercentage ? Number(formData.ugPercentage) : undefined,
        pgPercentage: formData.pgPercentage ? Number(formData.pgPercentage) : undefined,
        graduationYear: Number(formData.graduationYear),
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : []
      };
      if (editingStudent) {
        await studentService.updateStudent(editingStudent._id, payload);
        toast.success('Student updated');
      } else {
        await studentService.createStudent(payload);
        toast.success('Student added');
      }
      setShowAddEdit(false);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await studentService.deleteStudent(deleteTarget._id);
      toast.success('Student archived');
      setDeleteTarget(null);
      fetchStudents();
    } catch { toast.error('Delete failed'); }
  };

  const handleTemplateDownload = async () => {
    try {
      const blob = await studentService.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a'); a.href = url;
      a.download = 'student_template.xlsx'; a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Template download failed'); }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportLoading(true);
    try {
      const result = await studentService.importStudents(importFile);
      setImportResult(result);
      toast.success(`Imported ${result.imported || 0} students`);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImportLoading(false);
    }
  };

  const updateField = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const canManage = user?.role === 'admin' || user?.role === 'manager';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-1">Total: {total} students</p>
        </div>
        {canManage && (
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => { setShowImport(true); setImportFile(null); setImportResult(null); }}>
              <Upload className="w-4 h-4 mr-2" />Import Excel
            </Button>
            <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" />Add Student</Button>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <input
            type="text" placeholder="Search by name or roll number..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
          <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={genderFilter} onChange={e => { setGenderFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">All Genders</option>
            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={hostelFilter} onChange={e => { setHostelFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">All Status</option>
            {HOSTEL_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          {(search || deptFilter || genderFilter || hostelFilter) && (
            <button onClick={() => { setSearch(''); setDeptFilter(''); setGenderFilter(''); setHostelFilter(''); setPage(1); }}
              className="text-sm text-indigo-600 hover:text-indigo-800">Clear Filters</button>
          )}
        </div>
      </Card>

      {/* Student Table */}
      <Card>
        {loading ? <LoadingSpinner /> : students.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No students found" description="Add students or adjust your filters" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">UG %</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((s, idx) => (
                    <tr key={s._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{(page - 1) * 20 + idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{s.rollNumber}</td>
                      <td className="px-4 py-3 text-gray-900">{s.name}</td>
                      <td className="px-4 py-3"><Badge variant="info">{s.department}</Badge></td>
                      <td className="px-4 py-3 text-gray-600">{s.gender}</td>
                      <td className="px-4 py-3 text-gray-600">{s.mobile || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">{s.email || '-'}</td>
                      <td className="px-4 py-3 font-medium">{s.ugPercentage?.toFixed(1) || '-'}%</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <Badge variant={s.placementStatus === 'placed' ? 'success' : 'default'}>
                            {s.placementStatus.toUpperCase()}
                          </Badge>
                          {s.placementStatus === 'placed' && s.placedCompany && (
                            <span className="text-xs text-gray-500 font-medium">{s.placedCompany}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link to={`/students/${s._id}`} className="text-indigo-600 hover:text-indigo-800"><Eye className="w-4 h-4" /></Link>
                          {canManage && (
                            <>
                              <button onClick={() => openEdit(s)} className="text-gray-500 hover:text-gray-700"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => setDeleteTarget(s)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <span className="text-sm text-gray-500">Page {page} of {totalPages} ({total} students)</span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                  <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={showAddEdit} onClose={() => setShowAddEdit(false)} title={editingStudent ? 'Edit Student' : 'Add Student'} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Roll Number *" value={formData.rollNumber} onChange={e => updateField('rollNumber', e.target.value)} required disabled={!!editingStudent} />
            <Input label="Student Name *" value={formData.name} onChange={e => updateField('name', e.target.value)} required />
            <Select label="Department *" value={formData.department} onChange={e => updateField('department', e.target.value)} options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select label="Gender" value={formData.gender} onChange={e => updateField('gender', e.target.value)} options={GENDERS.map(g => ({ value: g, label: g }))} />
            <Select label="Hostel Status" value={formData.hostelStatus} onChange={e => updateField('hostelStatus', e.target.value)} options={HOSTEL_OPTIONS.map(h => ({ value: h, label: h }))} />
            <Input label="Graduation Year" value={formData.graduationYear} onChange={e => updateField('graduationYear', e.target.value)} type="number" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input label="SSLC %" value={formData.sslcPercentage} onChange={e => updateField('sslcPercentage', e.target.value)} type="number" />
            <Input label="HSC %" value={formData.hscPercentage} onChange={e => updateField('hscPercentage', e.target.value)} type="number" />
            <Input label="UG %" value={formData.ugPercentage} onChange={e => updateField('ugPercentage', e.target.value)} type="number" />
            <Input label="PG %" value={formData.pgPercentage} onChange={e => updateField('pgPercentage', e.target.value)} type="number" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Email" value={formData.email} onChange={e => updateField('email', e.target.value)} type="email" />
            <Input label="Mobile" value={formData.mobile} onChange={e => updateField('mobile', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="GitHub" value={formData.github} onChange={e => updateField('github', e.target.value)} />
            <Input label="LinkedIn" value={formData.linkedin} onChange={e => updateField('linkedin', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Resume URL" value={formData.resumeUrl} onChange={e => updateField('resumeUrl', e.target.value)} />
            <Input label="Portfolio URL" value={formData.portfolioUrl} onChange={e => updateField('portfolioUrl', e.target.value)} />
          </div>
          <Input label="Photo URL" value={formData.photoUrl} onChange={e => updateField('photoUrl', e.target.value)} />
          <Input label="Skills (comma-separated)" value={formData.skills} onChange={e => updateField('skills', e.target.value)} placeholder="JavaScript, Python, React" />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" type="button" onClick={() => setShowAddEdit(false)}>Cancel</Button>
            <Button type="submit" loading={formLoading}>{editingStudent ? 'Update' : 'Add Student'}</Button>
          </div>
        </form>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={showImport} onClose={() => setShowImport(false)} title="Import Students from Excel" size="md">
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Step 1: Download Template</h3>
            <Button variant="secondary" onClick={handleTemplateDownload}>
              <Download className="w-4 h-4 mr-2" />Download Excel Template
            </Button>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">Step 2: Upload File</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <input type="file" accept=".xlsx,.xls" onChange={e => setImportFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              {importFile && <p className="text-sm text-gray-600 mt-2">Selected: {importFile.name}</p>}
            </div>
          </div>
          {importResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">Import Complete</p>
              <p className="text-sm text-green-700">Successfully imported: {importResult.imported || 0}</p>
              <p className="text-sm text-green-700">Failed: {importResult.failed || 0}</p>
              {importResult.errors?.length > 0 && (
                <div className="mt-2 max-h-32 overflow-y-auto">
                  {importResult.errors.map((err: any, i: number) => (
                    <p key={i} className="text-xs text-red-600">Row {err.row}: {err.reason}</p>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowImport(false)}>Close</Button>
            <Button onClick={handleImport} loading={importLoading} disabled={!importFile || importLoading}>Import</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Archive Student"
        message={`Are you sure you want to archive ${deleteTarget?.name}? This will soft-delete the student record.`}
      />
    </div>
  );
}
