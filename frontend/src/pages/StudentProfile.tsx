import React, { useEffect, useState } from 'react';
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
          {student.photoUrl ? (
            <img src={student.photoUrl} alt={student.name} className="w-24 h-24 rounded-full mx-auto object-cover mb-4 ring-4 ring-indigo-50" />
          ) : (
            <div className="w-24 h-24 bg-indigo-100 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-indigo-600 mb-4">
              {student.name.charAt(0)}
            </div>
          )}
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
              <div><p className="text-sm text-gray-500">Email</p><a href={`mailto:${student.email}`} className="text-indigo-600 hover:underline">{student.email}</a></div>
              <div><p className="text-sm text-gray-500">Mobile</p><a href={`tel:${student.mobile}`} className="text-indigo-600 hover:underline">{student.mobile}</a></div>
              {student.github && <div><p className="text-sm text-gray-500">GitHub</p><a href={student.github} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">View Profile</a></div>}
              {student.linkedin && <div><p className="text-sm text-gray-500">LinkedIn</p><a href={student.linkedin} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">View Profile</a></div>}
              {student.portfolioUrl && <div><p className="text-sm text-gray-500">Portfolio</p><a href={student.portfolioUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Visit Site</a></div>}
              {student.resumeUrl && <div><p className="text-sm text-gray-500">Resume</p><a href={student.resumeUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">View Document</a></div>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
