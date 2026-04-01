'use client';

interface DataTableProps {
  title?: string;
  headers: string[];
  rows: Record<string, string>[];
  headerKeys: string[];
}

export default function DataTable({ title, headers, rows, headerKeys }: DataTableProps) {
  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {title && (
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              {headers.map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                {headerKeys.map(key => (
                  <td key={key} className="px-4 py-2.5 text-gray-700">
                    {row[key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
