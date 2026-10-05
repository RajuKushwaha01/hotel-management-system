import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { permissionsService } from '../../services/permissionsService';
import Skeleton from '../../components/ui/Skeleton';

const LEVEL_STYLE = (level) => {
  if (level === 'full') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
  if (level === 'none' || !level) return '';
  return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
};

const MODULE_LABEL = (m) => m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const ROLE_LABEL = (r) => r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function Permissions() {
  const [data, setData] = useState(null);

  useEffect(() => {
    permissionsService.getMatrix()
      .then((res) => setData(res.data.data))
      .catch(() => toast.error('Failed to load the permission matrix'));
  }, []);

  if (!data) return <Skeleton className="h-96" />;

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">Permission Matrix</h1>
      <p className="text-text-secondary text-sm mb-6">
        Live from the backend — this is exactly what every API route enforces, not a static reference.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-border dark:border-darkBorder">
        <table className="w-full text-sm">
          <thead className="bg-bgLight dark:bg-darkBg">
            <tr>
              <th className="text-left px-4 py-3 font-medium sticky left-0 bg-bgLight dark:bg-darkBg z-10">Module</th>
              {data.roles.map((r) => <th key={r} className="px-3 py-3 font-medium whitespace-nowrap">{ROLE_LABEL(r)}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.modules.map((m) => (
              <tr key={m} className="border-t border-border dark:border-darkBorder">
                <td className="px-4 py-3 font-medium sticky left-0 bg-white dark:bg-darkCard whitespace-nowrap">{MODULE_LABEL(m)}</td>
                {data.roles.map((r) => {
                  const level = data.matrix[m]?.[r];
                  return (
                    <td key={r} className="px-3 py-3 text-center">
                      {!level ? (
                        <X size={14} className="text-black/15 dark:text-white/15 mx-auto" />
                      ) : level === 'full' ? (
                        <Check size={16} className="text-success mx-auto" />
                      ) : (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize whitespace-nowrap ${LEVEL_STYLE(level)}`}>
                          {level.replace(/_/g, ' ')}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-text-secondary mt-4">
        To change a permission, edit <code>backend/src/config/permissionMatrix.js</code> — every route reads from that one file, so there's nowhere else to update.
      </p>
    </div>
  );
}
