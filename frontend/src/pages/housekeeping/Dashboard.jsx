import { useEffect, useState } from 'react';
import { ClipboardList, Sparkles, CheckCircle, Search, Wrench, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { housekeepingService } from '../../services/housekeepingService';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

const STATUS_COLORS = {
  pending: 'bg-slate-100 text-slate-700', accepted: 'bg-blue-100 text-blue-700',
  cleaning: 'bg-amber-100 text-amber-700', inspection: 'bg-purple-100 text-purple-700',
  clean: 'bg-emerald-100 text-emerald-700',
};

export default function HousekeepingDashboard() {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [damageTarget, setDamageTarget] = useState(null);
  const [damageDesc, setDamageDesc] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([housekeepingService.getDashboard(), housekeepingService.getTasks()])
      .then(([s, t]) => { setStats(s.data.data); setTasks(t.data.data); })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const act = async (fn, successMsg) => {
    try {
      await fn();
      toast.success(successMsg);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDamageSubmit = async (e) => {
    e.preventDefault();
    await act(() => housekeepingService.reportDamage(damageTarget, damageDesc), 'Damage reported to maintenance');
    setDamageTarget(null);
    setDamageDesc('');
  };

  if (loading) {
    return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(7)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>;
  }

  const cards = [
    { label: 'Assigned to Me', value: stats.assigned, icon: ClipboardList, color: 'blue' },
    { label: 'Dirty Rooms', value: stats.dirty, icon: AlertTriangle, color: 'gold' },
    { label: 'Cleaning', value: stats.cleaning, icon: Sparkles, color: 'purple' },
    { label: 'Clean', value: stats.clean, icon: CheckCircle, color: 'green' },
    { label: 'Inspection Pending', value: stats.inspectionPending, icon: Search, color: 'gold' },
    { label: 'Maintenance', value: stats.maintenanceRooms, icon: Wrench, color: 'purple' },
    { label: 'Priority Tasks', value: stats.urgentTasks, icon: AlertTriangle, color: 'gold' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">Housekeeping</h1>
      <p className="text-text-secondary text-sm mb-6">Room cleaning workflow and priority tasks</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      <Card>
        <h3 className="font-semibold mb-4">Room Tasks</h3>
        {tasks.length === 0 ? <EmptyState title="No active tasks" /> : (
          <div className="space-y-3">
            {tasks.map((t) => (
              <div key={t._id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border dark:border-darkBorder pb-3 last:border-0">
                <div>
                  <p className="font-medium">Room {t.room?.roomNumber} <span className="text-text-secondary text-xs">({t.room?.roomType})</span></p>
                  <div className="flex gap-2 mt-1">
                    <StatusBadge status={t.status === 'pending' ? 'pending' : t.status === 'clean' ? 'clean' : 'dirty'} />
                    {t.priority !== 'normal' && <span className="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger capitalize">{t.priority}</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {t.status === 'pending' && <Button className="!px-3 !py-1.5 text-xs" onClick={() => act(() => housekeepingService.acceptTask(t._id), 'Task accepted')}>Accept</Button>}
                  {t.status === 'accepted' && <Button variant="gold" className="!px-3 !py-1.5 text-xs" onClick={() => act(() => housekeepingService.startCleaning(t._id), 'Cleaning started')}>Start Cleaning</Button>}
                  {t.status === 'cleaning' && <Button variant="gold" className="!px-3 !py-1.5 text-xs" onClick={() => act(() => housekeepingService.completeCleaning(t._id), 'Sent for inspection')}>Complete</Button>}
                  {t.status === 'inspection' && <Button variant="gold" className="!px-3 !py-1.5 text-xs" onClick={() => act(() => housekeepingService.markClean(t._id), 'Room marked clean')}>Mark Clean</Button>}
                  {t.status !== 'clean' && <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => setDamageTarget(t._id)}>Report Damage</Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={!!damageTarget} onClose={() => setDamageTarget(null)} title="Report Damage" size="sm">
        <form onSubmit={handleDamageSubmit} className="space-y-4">
          <Input placeholder="Describe the damage..." value={damageDesc} onChange={(e) => setDamageDesc(e.target.value)} required />
          <Button variant="gold" className="w-full">Send to Maintenance</Button>
        </form>
      </Modal>
    </div>
  );
}
