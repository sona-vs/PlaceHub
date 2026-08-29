import React, { useState, useEffect } from 'react';
import { 
  Building2, Briefcase, FileText, CheckCircle, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { atsService } from '../services/atsService';
import { companyService } from '../services/companyService';
import { Company, ATSResult } from '../types';

import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import EmptyState from '../components/ui/EmptyState';

export default function ATS() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [results, setResults] = useState<ATSResult[]>([]);
  
  // Results Modal State
  const [selectedRange, setSelectedRange] = useState<{min: number, max: number, label: string} | null>(null);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await companyService.getCompanies();
      // Only warm, hot, or drive_completed
      const eligible = data.filter((c: any) => ['warm', 'hot', 'drive_completed'].includes(c.status));
      setCompanies(eligible);
    } catch (error) {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleRunMatching = async () => {
    if (!selectedCompany) return;
    try {
      setMatching(true);
      await atsService.runMatching(selectedCompany._id);
      toast.success('Matching completed successfully');
      fetchResults(selectedCompany._id);
    } catch (error) {
      toast.error('Failed to run matching');
    } finally {
      setMatching(false);
    }
  };

  const fetchResults = async (companyId: string) => {
    try {
      const data = await atsService.getResults(companyId);
      // Backend returns either an array of results or an object { results, bracket... } depending on endpoint.
      const list = data.results || data || [];
      setResults([...list].sort((a, b) => (b.atsScore || 0) - (a.atsScore || 0)));
    } catch (error) {
      toast.error('Failed to fetch results');
    }
  };

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    fetchResults(company._id);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'warm': return 'warm';
      case 'hot': return 'hot';
      case 'drive_completed': return 'completed';
      default: return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 91) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (score >= 81) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 71) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };
  
  const getScoreBadgeVariant = (score: number) => {
    if (score >= 91) return 'success';
    if (score >= 81) return 'info';
    if (score >= 71) return 'warning';
    return 'default';
  };

  const brackets = [
    { label: '91-100%', min: 91, max: 100, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { label: '81-90%', min: 81, max: 90, color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { label: '71-80%', min: 71, max: 80, color: 'bg-amber-50 border-amber-200 text-amber-700' },
    { label: '61-70%', min: 61, max: 70, color: 'bg-slate-50 border-slate-200 text-slate-700' },
  ];

  const getCountForBracket = (min: number, max: number) => {
    return results.filter(r => (r.atsScore || 0) >= min && (r.atsScore || 0) <= max).length;
  };

  const studentsInRange = selectedRange 
    ? results.filter(r => (r.atsScore || 0) >= selectedRange.min && (r.atsScore || 0) <= selectedRange.max)
    : [];

  if (loading) {
    return <div className="flex justify-center py-12"><LoadingSpinner /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ATS — Resume Matching</h1>

      {!selectedCompany ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map(company => (
            <div 
              key={company._id}
              onClick={() => handleSelectCompany(company)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{company.name}</h3>
                <Badge variant={getStatusBadgeVariant(company.status)}>
                  {company.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>CTC: ₹{company.ctc} LPA</p>
                {company.jdParsedData?.skills && (
                  <p>Skills: {company.jdParsedData.skills.length} identified</p>
                )}
              </div>
              <div className="mt-4 flex items-center justify-end text-sm font-medium text-indigo-600">
                Select <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          ))}
          {companies.length === 0 && (
            <div className="col-span-full">
               <EmptyState icon={Building2} title="No eligible companies" description="There are no warm, hot, or completed companies available for matching." />
             </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 cursor-pointer hover:text-gray-800 w-max" onClick={() => setSelectedCompany(null)}>
            <ChevronRight className="w-4 h-4 rotate-180" /> Back to companies
          </div>
          
          <Card>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedCompany.name}</h2>
                <div className="flex gap-2 mt-2">
                  <Badge variant={getStatusBadgeVariant(selectedCompany.status)}>
                    {selectedCompany.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-500">CTC: ₹{selectedCompany.ctc} LPA</span>
                </div>
              </div>
              <Button onClick={handleRunMatching} loading={matching} size="lg">
                <CheckCircle className="w-4 h-4 mr-2" /> Run ATS Matching
              </Button>
            </div>

            {selectedCompany.jobDescription && (
              <div className="bg-white rounded-lg p-4 mb-4 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-indigo-600" /> Full Job Description
                </h3>
                <div className="text-sm text-gray-600 whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedCompany.jobDescription}
                </div>
              </div>
            )}

            {selectedCompany.jdParsedData && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                  <Briefcase className="w-4 h-4 mr-2" /> Job Requirements parsed from JD
                </h3>
                <div className="space-y-4">
                  {selectedCompany.jdParsedData.skills && (
                    <div>
                      <span className="text-xs text-gray-500 uppercase font-semibold">Key Skills</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedCompany.jdParsedData.skills.map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-700">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {results.length > 0 && (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 mt-8">Match Results</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {brackets.map(bracket => (
                    <div 
                      key={bracket.label}
                      onClick={() => { setSelectedRange(bracket); setIsRangeModalOpen(true); }}
                      className={`p-4 rounded-xl border cursor-pointer hover:shadow-md transition-shadow flex flex-col items-center justify-center ${bracket.color}`}
                    >
                      <div className="text-3xl font-bold mb-1">{getCountForBracket(bracket.min, bracket.max)}</div>
                      <div className="text-sm font-medium">{bracket.label}</div>
                    </div>
                  ))}
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-medium text-gray-500">Rank</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500">Roll Number</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500">Student Name</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500">Department</th>
                        <th className="px-6 py-3 text-left font-medium text-gray-500">ATS Score</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.filter(r => (r.atsScore || 0) > 0).map((result, index) => (
                        <tr key={result._id || index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">#{index + 1}</td>
                          <td className="px-6 py-4 text-gray-600">{result.student?.rollNumber}</td>
                          <td className="px-6 py-4 text-gray-900">{result.student?.name}</td>
                          <td className="px-6 py-4 text-gray-600">{result.student?.department}</td>
                          <td className="px-6 py-4">
                            <Badge variant={getScoreBadgeVariant(result.atsScore || 0)}>
                              {result.atsScore || 0}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            
            {results.length === 0 && !matching && (
              <EmptyState icon={FileText} title="No results yet" description="Click 'Run ATS Matching' to analyze student resumes against this company's JD." />
            )}
          </Card>
        </div>
      )}

      <Modal isOpen={isRangeModalOpen} onClose={() => setIsRangeModalOpen(false)} title={`Students in ${selectedRange?.label} Range`} size="lg">
        <div className="max-h-[60vh] overflow-y-auto">
          {studentsInRange.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Roll Number</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Student Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Department</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentsInRange.map((result, index) => (
                  <tr key={result._id || index}>
                    <td className="px-4 py-3 text-gray-600">{result.student?.rollNumber}</td>
                    <td className="px-4 py-3 text-gray-900">{result.student?.name}</td>
                    <td className="px-4 py-3 text-gray-600">{result.student?.department}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getScoreBadgeVariant(result.atsScore || 0)}>
                        {result.atsScore || 0}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-8">No students found in this range.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
