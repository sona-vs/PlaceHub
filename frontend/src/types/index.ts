export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'lead';
  avatar?: string;
}

export interface Student {
  _id: string;
  rollNumber: string;
  name: string;
  department: string;
  gender: string;
  hostelStatus: string;
  sslcPercentage: number;
  hscPercentage: number;
  ugPercentage: number;
  pgPercentage?: number;
  graduationYear: number;
  email: string;
  mobile: string;
  github?: string;
  linkedin?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  photoUrl?: string;
  skills: string[];
  isArchived: boolean;
  placementStatus: string;
  placedCompany?: string;
  ctc?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  _id: string;
  name: string;
  location: string;
  mapsLink?: string;
  website?: string;
  hrName: string;
  hrEmail: string;
  hrMobile: string;
  companySize?: string;
  jobDescription?: string;
  jdFileUrl?: string;
  jdParsedData?: {
    skills: string[];
    qualifications: string[];
    experience: string;
    jobTitle: string;
    keywords: string[];
  };
  ctc: number;
  assignedMember?: User;
  status: 'cold' | 'warm' | 'hot' | 'drive_completed';
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'forwarded';
  offersCount: number;
  studentsAppeared: number;
  studentsPlaced: number;
  statusHistory: Array<{ status: string; changedAt: string; note?: string }>;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface PlacementTeamMember {
  _id: string;
  user?: User;
  name: string;
  email: string;
  role: string;
  assignedCompanies: Company[];
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedEntity?: string;
  relatedId?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  user?: User;
  userName: string;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
}

export interface ATSResult {
  student: Student;
  atsScore: number;
  _id: string;
}

export interface DashboardStats {
  totalStudents: number;
  departmentStrength: Array<{ _id: string; count: number }>;
  genderDistribution: Array<{ _id: string; count: number }>;
  academicBrackets: {
    below60: number;
    '60_70': number;
    '70_75': number;
    '75_80': number;
    '80_90': number;
    above90: number;
  };
  companyPipeline: { cold: number; warm: number; hot: number; drive_completed: number };
  totalCompanies: number;
  totalOffers: number;
  totalPlaced: number;
  placementPercentage: number;
  teamStats: Array<{
    name: string;
    cold: number;
    warm: number;
    hot: number;
    drive_completed: number;
    totalOffers: number;
  }>;
  topDrives: Array<{
    company: string;
    studentsAppeared: number;
    studentsPlaced: number;
    ctc: number;
  }>;
}
