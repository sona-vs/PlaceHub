import React from 'react';
import { Button } from './Button';

export const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void }> = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-gray-700">
          Showing page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
        </p>
      </div>
      <div>
        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
          <Button variant="secondary" size="sm" className="rounded-l-md rounded-r-none" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>Previous</Button>
          <Button variant="secondary" size="sm" className="rounded-l-none rounded-r-md" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>Next</Button>
        </nav>
      </div>
    </div>
  </div>
);

export default Pagination;
