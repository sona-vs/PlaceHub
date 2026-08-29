import React, { useState } from 'react';
import { 
  FileText, CheckCircle, Users, Building2, Download, ChevronDown, ChevronUp
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { reportService } from '../services/reportService';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';

const exportToExcel = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    toast.error('No data to export');
    return;
  }
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export default function Reports() {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<Record<string, any[]>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const loadData = async (type: string, fetchFn: () => Promise<any[]>) => {
    if (data[type]) {
      setExpanded(prev => ({ ...prev, [type]: !prev[type] }));
      return;
    }

    try {
      setLoading(prev => ({ ...prev, [type]: true }));
      const result = await fetchFn();
      setData(prev => ({ ...prev, [type]: result }));
      setExpanded(prev => ({ ...prev, [type]: true }));
    } catch (error) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleExport = (type: string, filename: string) => {
    if (data[type]) {
      exportToExcel(data[type], filename);
    }
  };

  const ReportCard = ({ 
    id, title, description, icon: Icon, fetchFn, renderTable 
  }: { 
    id: string, title: string, description: string, icon: any, fetchFn: () => Promise<any[]>, renderTable: (data: any[]) => React.ReactNode 
  }) => {
    const isExpanded = expanded[id];
    const isLoading = loading[id];
    const reportData = data[id];

    return (
      <Card>
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => loadData(id, fetchFn)}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </div>
          <div>
            {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <div className="flex justify-end mb-4">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => handleExport(id, title.replace(/\s+/g, '_'))}
                disabled={!reportData || reportData.length === 0}
              >
                <Download className="w-4 h-4 mr-2" /> Export to Excel
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8"><LoadingSpinner /></div>
            ) : !reportData || reportData.length === 0 ? (
              <EmptyState icon={FileText} title="No data available" description="" />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                {renderTable(reportData)}
              </div>
            )}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <ReportCard
          id="company-registrations"
          title="Company Registrations"
          description="Active warm and hot companies"
          icon={FileText}
          fetchFn={reportService.getCompanyRegistrations}
          renderTable={(data) => (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">S.No</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Location</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">HR Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">CTC</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                    <td className="px-4 py-3 text-gray-600">{row.location}</td>
                    <td className="px-4 py-3 text-gray-600">{row.hrName}</td>
                    <td className="px-4 py-3 text-gray-600">{row.ctc} LPA</td>
                    <td className="px-4 py-3 text-gray-600">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        />

        <ReportCard
          id="drive-selections"
          title="Drive Selections"
          description="Students selected in placement drives"
          icon={CheckCircle}
          fetchFn={reportService.getDriveSelections}
          renderTable={(data) => (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">S.No</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Roll Number</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Student Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Department</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">CTC</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.rollNumber}</td>
                    <td className="px-4 py-3 text-gray-900">{row.studentName}</td>
                    <td className="px-4 py-3 text-gray-600">{row.department}</td>
                    <td className="px-4 py-3 text-gray-600">{row.companyName}</td>
                    <td className="px-4 py-3 text-gray-600">{row.ctc} LPA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        />

        <ReportCard
          id="placement-master"
          title="Overall Placement Master"
          description="Complete student placement status"
          icon={Users}
          fetchFn={reportService.getPlacementMaster}
          renderTable={(data) => (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">S.No</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Roll Number</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">CTC</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.rollNumber}</td>
                    <td className="px-4 py-3 text-gray-900">{row.studentName}</td>
                    <td className="px-4 py-3 text-gray-600">{row.companyName || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{row.ctc ? `${row.ctc} LPA` : '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={row.status === 'Placed' ? 'success' : 'warning'}>
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        />

        <ReportCard
          id="company-master"
          title="Company Master"
          description="Complete company repository"
          icon={Building2}
          fetchFn={reportService.getCompanyMaster}
          renderTable={(data) => (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">S.No</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">CTC</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Assigned</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                    <td className="px-4 py-3 text-gray-600">{row.ctc} LPA</td>
                    <td className="px-4 py-3 text-gray-600">{row.assignedMemberName || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        />
      </div>
    </div>
  );
}
