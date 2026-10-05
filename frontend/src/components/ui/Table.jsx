export default function Table({ columns, data, loading, emptyMessage = 'No records found' }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-black/5 dark:bg-white/5 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <p className="text-center text-text-secondary py-10 text-sm">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border dark:border-darkBorder">
      <table className="w-full text-sm">
        <thead className="bg-bgLight dark:bg-darkBg">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="text-left px-4 py-3 font-medium text-text-secondary whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id || i}
              className="border-t border-border dark:border-darkBorder hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
