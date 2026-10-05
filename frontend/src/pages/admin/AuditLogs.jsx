import { useEffect, useState } from 'react';
import { ScrollText, Download, Activity, ShieldAlert, FileLock2, Search, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { auditService } from '../../services/auditService';
import StatCard from '../../components/ui/StatCard';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

const ACTION_STYLE = (a) => {
  if (/DELETED|DENIED|FAILED|LOCKED/.test(a)) return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300';
  if (/CREATED|UPLOADED|SUCCESS/.test(a)) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
  if (/VIEWED|DOWNLOADED|EXPORTED/.test(a)) return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300';
  return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
};

const formatVal = (key, v) => {
  if (v === undefined || v === null) return '—';
  if (typeof v === 'number' && /price|rate|amount|charge|cost/i.test(key)) return `₹${v.toLocaleString()}`;
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [options, setOptions] = useState({ modules: [], actions: [] });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ search: '', module: '', action: '', from: '', to: '' });

  const params = () => Object.fromEntries(Object.entries(filters).filter(([, v]) => v));

  const loadLogs = () => {
    setLoading(true);
    auditService.getLogs({ ...params(), page })
      .then((res) => { setLogs(res.data.data); setPages(res.data.pagination.pages || 1); })
      .catch(() => toast.error('Failed to load audit log'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    auditService.getStats().then((r) => setStats(r.data.data)).catch(() => {});
    auditService.getFilters().then((r) => setOptions(r.data.data)).catch(() => {});
  }, []);

  useEffect(loadLogs, [page, filters.module, filters.action, filters.from, filters.to]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); loadLogs(); };

  const handleExport = async () => {
    try {
      const res = await auditService.exportCsv(params());
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Audit log exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const columns = [
    { key: 'createdAt', label: 'When', render: (r) => (
      <div><p>{new Date(r.createdAt).toLocaleDateString()}</p><p className="text-xs text-text-secondary">{new Date(r.createdAt).toLocaleTimeString()}</p></div>
    ) },
    { key: 'who', label: 'Who', render: (r) => (
      <div><p className="font-medium">{r.userName || 'System'}</p><p className="text-xs text-text-secondary capitalize">{r.userRole?.replace(/_/g, ' ')}</p></div>
    ) },
    { key: 'action', label: 'What', render: (r) => (
      <div className="max-w-xs whitespace-normal">
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${ACTION_STYLE(r.action)}`}>{r.action.replace(/_/g, ' ')}</span>
        <p className="text-xs mt-1 text-text-secondary">{r.description}</p>
      </div>
    ) },
    { key: 'target', label: 'Target', render: (r) => r.targetLabel || r.targetType || '—' },
    { key: 'ip', label: 'IP / Session', render: (r) => (
      <div><p className="text-xs">{r.ipAddress || '—'}</p><p className="text-[11px] text-text-secondary font-mono">{r.sessionId || ''}</p></div>
    ) },
    { key: 'view', label: '', render: (r) => <button onClick={() => setSelected(r)} className="text-sm text-gold hover:underline">Details</button> },
  ];

  const diffKeys = selected ? Array.from(new Set([...Object.keys(selected.oldValue || {}), ...Object.keys(selected.newValue || {})])) : [];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display mb-1 flex items-center gap-2"><ScrollText className="text-gold" size={24} /> Audit Log</h1>
          <p className="text-text-secondary text-sm">Tamper-proof record of who did what, when, and from where</p>
        </div>
        <Button variant="outline" onClick={handleExport} className="flex items-center gap-2"><Download size={16} /> Export CSV</Button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Events (24h)" value={stats.last24h} icon={Activity} color="blue" />
          <StatCard label="Total Events" value={stats.total.toLocaleString()} icon={ScrollText} color="gold" />
          <StatCard label="Failed Logins (24h)" value={stats.failedLogins} icon={ShieldAlert} color="purple" />
          <StatCard label="ID Doc Access (24h)" value={stats.sensitiveAccess} icon={FileLock2} color="green" />
        </div>
      )}

      <form onSubmit={handleSearch} className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5 items-end">
        <div className="col-span-2">
          <Input placeholder="Search user, target, description..." icon={Search} value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        </div>
        <select value={filters.module} onChange={(e) => { setPage(1); setFilters({ ...filters, module: e.target.value }); }} className="px-3 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg text-sm capitalize">
          <option value="">All modules</option>
          {options.modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filters.action} onChange={(e) => { setPage(1); setFilters({ ...filters, action: e.target.value }); }} className="px-3 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg text-sm">
          <option value="">All actions</option>
          {options.actions.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
        <Input type="date" value={filters.from} onChange={(e) => { setPage(1); setFilters({ ...filters, from: e.target.value }); }} />
        <Input type="date" value={filters.to} onChange={(e) => { setPage(1); setFilters({ ...filters, to: e.target.value }); }} />
      </form>

      <Table columns={columns} data={logs} loading={loading} emptyMessage="No audit entries match these filters" />

      <div className="flex items-center justify-between mt-4 text-sm">
        <span className="text-text-secondary">Page {page} of {pages}</span>
        <div className="flex gap-2">
          <Button variant="outline" className="!px-3 !py-1.5 text-xs" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button variant="outline" className="!px-3 !py-1.5 text-xs" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Audit Entry" size="lg">
        {selected && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-text-secondary text-xs">WHO</p><p className="font-medium">{selected.userName || 'System'} <span className="text-text-secondary capitalize">({selected.userRole?.replace(/_/g, ' ')})</span></p></div>
              <div><p className="text-text-secondary text-xs">WHEN</p><p className="font-medium">{new Date(selected.createdAt).toLocaleString()}</p></div>
              <div className="col-span-2"><p className="text-text-secondary text-xs">WHAT</p><p className="font-medium">{selected.description}</p></div>
              <div><p className="text-text-secondary text-xs">TARGET</p><p className="font-medium">{selected.targetLabel || selected.targetType || '—'}</p></div>
              <div><p className="text-text-secondary text-xs">IP / SESSION</p><p className="font-medium">{selected.ipAddress || '—'} <span className="font-mono text-xs text-text-secondary">{selected.sessionId}</span></p></div>
            </div>

            {diffKeys.length > 0 && (
              <div className="rounded-xl border border-border dark:border-darkBorder overflow-hidden">
                <div className="px-4 py-2 bg-bgLight dark:bg-darkBg text-xs font-medium text-text-secondary">OLD VALUE → NEW VALUE</div>
                {diffKeys.map((k) => (
                  <div key={k} className="grid grid-cols-[1fr_1.2fr_auto_1.2fr] items-center gap-2 px-4 py-2.5 border-t border-border dark:border-darkBorder">
                    <span className="text-text-secondary capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-danger line-through break-all">{formatVal(k, selected.oldValue?.[k])}</span>
                    <ArrowRight size={14} className="text-text-secondary" />
                    <span className="text-success font-medium break-all">{formatVal(k, selected.newValue?.[k])}</span>
                  </div>
                ))}
              </div>
            )}
            {selected.userAgent && <p className="text-[11px] text-text-secondary break-all">Device: {selected.userAgent}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
