import { useEffect, useState } from 'react';
import { DatabaseBackup, Download, RotateCcw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { backupService } from '../../services/backupService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';

const formatSize = (b) => !b ? '—' : b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;

export default function Backup() {
  const [history, setHistory] = useState([]);
  const [running, setRunning] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [confirmText, setConfirmText] = useState('');

  const load = () => backupService.getHistory().then((res) => setHistory(res.data.data));
  useEffect(() => { load(); }, []);

  const handleRunBackup = async () => {
    setRunning(true);
    try {
      await backupService.run();
      toast.success('Backup completed');
      load();
    } catch {
      toast.error('Backup failed');
    } finally {
      setRunning(false);
    }
  };

  const handleDownload = async (log) => {
    try {
      const res = await backupService.download(log._id);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url; a.download = log.fileName; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const handleRestore = async () => {
    try {
      await backupService.restore(restoreTarget._id, confirmText);
      toast.success('Database restored. Please log in again.');
      setRestoreTarget(null);
      setConfirmText('');
      setTimeout(() => { localStorage.removeItem('token'); window.location.href = '/login'; }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Restore failed');
    }
  };

  const columns = [
    { key: 'fileName', label: 'Backup File' },
    { key: 'collections', label: 'Collections', render: (r) => r.collections?.length || 0 },
    { key: 'sizeBytes', label: 'Size', render: (r) => formatSize(r.sizeBytes) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status === 'completed' ? 'completed' : 'cancelled'} /> },
    { key: 'triggeredBy', label: 'By', render: (r) => r.triggeredBy ? `${r.triggeredBy.firstName} ${r.triggeredBy.lastName}` : 'System' },
    { key: 'createdAt', label: 'Date', render: (r) => new Date(r.createdAt).toLocaleString() },
    {
      key: 'actions', label: 'Actions',
      render: (r) => r.status === 'completed' && (
        <div className="flex gap-2">
          <button onClick={() => handleDownload(r)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10" title="Download"><Download size={15} /></button>
          <button onClick={() => setRestoreTarget(r)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-danger" title="Restore"><RotateCcw size={15} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display mb-1 flex items-center gap-2"><DatabaseBackup className="text-gold" size={24} /> Backup & Restore</h1>
          <p className="text-text-secondary text-sm">Snapshot the entire database or restore from a previous backup</p>
        </div>
        <Button variant="gold" onClick={handleRunBackup} disabled={running}>{running ? 'Backing up...' : 'Run Backup Now'}</Button>
      </div>

      <div className="mb-5 p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-3 text-sm">
        <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
        <p>Restoring a backup <strong>replaces all current data</strong> and cannot be undone. Only run this if you're certain.</p>
      </div>

      <Table columns={columns} data={history} emptyMessage="No backups yet — click 'Run Backup Now' to create one" />

      <Modal open={!!restoreTarget} onClose={() => setRestoreTarget(null)} title="Restore Database" size="sm">
        <p className="text-sm text-text-secondary mb-4">
          This will permanently replace all current data with the contents of <strong>{restoreTarget?.fileName}</strong>. Type <span className="font-mono text-danger">RESTORE</span> to confirm.
        </p>
        <Input placeholder="Type RESTORE" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
        <Button variant="gold" className="w-full mt-4 !bg-danger !bg-none" disabled={confirmText !== 'RESTORE'} onClick={handleRestore}>
          Confirm Restore
        </Button>
      </Modal>
    </div>
  );
}
