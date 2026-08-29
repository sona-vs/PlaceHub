import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-red-50 p-6 rounded-full mb-6">
        <ShieldAlert className="w-16 h-16 text-red-500" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
      <p className="text-gray-500 max-w-md mb-8">
        You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
      </p>
      <Button onClick={() => navigate('/')} size="lg">
        <ArrowLeft className="w-4 h-4 mr-2" /> Go to Dashboard
      </Button>
    </div>
  );
}
