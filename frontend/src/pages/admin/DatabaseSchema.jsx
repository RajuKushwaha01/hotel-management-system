import { useEffect, useState } from 'react';
import { Database, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { schemaService } from '../../services/schemaService';
import StatCard from '../../components/ui/StatCard';
import Modal from '../../components/ui/Modal';
import Skeleton from '../../components/ui/Skeleton';

export default function DatabaseSchema() {
  const [stats, setStats] = useState(null);
  const [entities, setEntities] = useState([]);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    schemaService.getStats().then((res) => setStats(res.data.data)).catch(() => {});
    schemaService.getEntityMap().then((res) => setEntities(res.data.data)).catch(() => toast.error('Failed to load schema map'));
  }, []);

  const openDetail = async (modelName) => {
    try {
      const res = await schemaService.getCollectionDetail(modelName);
      setDetail(res.data.data);
    } catch { toast.error('Failed to load collection detail'); }
  };

  return (
    <div>
      <h1 className="text-2xl font-display mb-1 flex items-center gap-2"><Database className="text-gold" size={24} /> Database Schema</h1>
      <p className="text-text-secondary text-sm mb-6">Every entity from the spec, resolved against the live database — not a static diagram</p>

      {stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Database" value={stats.dbName} icon={Database} color="gold" />
          <StatCard label="Collections" value={stats.totalCollections} icon={Database} color="blue" />
          <StatCard label="Indexes" value={stats.totalIndexes} icon={Database} color="purple" />
          <StatCard label="Connection" value={stats.connectionState} icon={Database} color="green" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {entities.map((e) => (
          <div key={e.entity} className="p-4 rounded-2xl bg-white dark:bg-darkCard border border-border dark:border-darkBorder">
            <div className="flex items-start justify-between mb-1">
              <p className="font-mono text-sm font-medium">{e.entity}</p>
              {e.implemented === 'config' ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">code-based</span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">collection</span>
              )}
            </div>
            {e.models ? (
              <div className="space-y-1 mt-2">
                {e.models.map((m) => (
                  <button
                    key={m.name}
                    onClick={() => m.count !== null && openDetail(m.name)}
                    className="w-full flex items-center justify-between text-xs text-text-secondary hover:text-gold transition"
                  >
                    <span className="flex items-center gap-1">{m.name} <ChevronRight size={11} /></span>
                    <span>{m.count ?? '—'} docs</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-secondary mt-2">{e.note}</p>
            )}
            {e.note && e.models && <p className="text-[11px] text-text-secondary mt-2">{e.note}</p>}
          </div>
        ))}
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.collectionName} size="lg">
        {detail && (
          <div>
            <p className="text-sm text-text-secondary mb-4">{detail.count} document(s) in this collection</p>
            <div className="overflow-x-auto rounded-xl border border-border dark:border-darkBorder mb-4">
              <table className="w-full text-xs">
                <thead className="bg-bgLight dark:bg-darkBg"><tr><th className="text-left px-3 py-2">Field</th><th className="text-left px-3 py-2">Type</th><th className="text-left px-3 py-2">Required</th></tr></thead>
                <tbody>
                  {detail.fields.map((f) => (
                    <tr key={f.field} className="border-t border-border dark:border-darkBorder">
                      <td className="px-3 py-2 font-mono">{f.field}</td>
                      <td className="px-3 py-2">{f.type}</td>
                      <td className="px-3 py-2">{f.required ? 'Yes' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {detail.sample && (
              <div>
                <p className="text-xs font-medium mb-1">Sample document</p>
                <pre className="text-[10px] p-3 rounded-xl bg-bgLight dark:bg-darkBg overflow-x-auto max-h-48">{JSON.stringify(detail.sample, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
