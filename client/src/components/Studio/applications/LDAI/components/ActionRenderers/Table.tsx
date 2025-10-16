// frontend/src/applications/LDAI/components/ActionRenderers/Table.tsx
export default function Table({ columns, rows }: { columns: string[]; rows: any[][] }) {
  // Check if the payload contains error messages instead of proper table data
  const hasErrorData = columns.some(col => 
    typeof col === 'string' && (
      col.toLowerCase().includes('error') || 
      col.toLowerCase().includes('validation') ||
      col.toLowerCase().includes('missing')
    )
  ) || rows.some(row => 
    row.some(cell => 
      typeof cell === 'string' && (
        cell.toLowerCase().includes('error') || 
        cell.toLowerCase().includes('validation') ||
        cell.toLowerCase().includes('missing') ||
        cell.toLowerCase().includes('required')
      )
    )
  );

  if (hasErrorData) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <div className="flex items-center gap-2 text-red-700 mb-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="font-medium">Tool Execution Error</span>
        </div>
        <p className="text-sm text-red-600">
          The requested data could not be retrieved due to missing parameters or validation errors. 
          Please try rephrasing your request or provide additional context.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr className="text-left text-gray-500">
            {columns.map((c, i) => <th key={i} className="px-2 py-1 font-medium">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-gray-100">
              {r.map((cell: any, ci: number) => <td key={ci} className="px-2 py-1">{String(cell)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}