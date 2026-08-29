import React from 'react';

export const DataTable: React.FC<{ columns: any[]; data: any[]; loading?: boolean }> = ({ columns, data, loading }) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {columns.map((col, i) => (
            <th key={i} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {loading ? (
          <tr><td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">Loading...</td></tr>
        ) : data.length === 0 ? (
          <tr><td colSpan={columns.length} className="px-6 py-4 text-center text-sm text-gray-500">No data found</td></tr>
        ) : (
          data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map((col, j) => (
                <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default DataTable;
