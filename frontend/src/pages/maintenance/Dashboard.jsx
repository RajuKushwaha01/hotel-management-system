import { useEffect, useState } from 'react';
import { AlertTriangle, ClipboardList, Wrench, CheckCircle, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { maintenanceService } from '../../services/maintenanceService';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';

const CATEGORY_LABELS = { ac: 'AC', electrical: 'Electrical', plumbing: 'Plumbing', wifi: 'Wi-Fi', tv: 'TV', furniture: 'Furniture', bathroom: 'Bathroom', elevator: 'Elevator', generator: 'Generator', water: 'Water', appliances: 'Appliances' };

export default function MaintenanceDashboard() {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [completeTarget, setCompleteTarget] = useState(null);
  const [repairForm, setRepairForm] = useState({ repairNotes: '', partName: '', partCost: '' });

  const load = () => {
    Promise.all([maintenanceService.getDashboard(), maintenanceService.getTickets()])
      .then(([s, t]) => { setStats(s.data.data); setTickets(t.data.data); })
      .catch(() => toast.error('Failed to load'));
  };
  useEffect(() => { load(); }, []);

  const act = async (fn, msg) => {
    try { await fn(); toast.success(msg); load(); } catch { toast.error('Action failed'); }
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    const partsUsed = repairForm.partName ? [{ name: repairForm.partName, quantity: 1, cost: Number(repairForm.partCost) || 0 }] : [];
    await act(() => maintenanceService.completeTicket(completeTarget, { repairNotes: repairForm.repairNotes, partsUsed }), 'Marked completed');
    setCompleteTarget(null);
    setRepairForm({ repairNotes: '', partName: '', partCost: '' });
  };

  if (!stats) return null;

  const cards = [
    { label: 'New Requests', value: stats.newRequests, icon: AlertTriangle, color: 'gold' },
    { label: 'High Priority', value: stats.highPriority, icon: AlertTriangle, color: 'purple' },
    { label: 'Assigned', value: stats.assigned, icon: ClipboardList, color: 'blue' },
    { label: 'In Progress', value: stats.inProgress, icon: Wrench, color: 'gold' },
    { label: 'Completed Today', value: stats.completed, icon: CheckCircle, color: 'green' },
    { label: 'Out of Order Rooms', value: stats.outOfOrderRooms, icon: Ban, color: 'purple' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">Maintenance</h1>
      <p className="text-text-secondary text-sm mb-6">Repair tickets and workflow tracking</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      <Card>
        <h3 className="font-semibold mb-4">Tickets</h3>
        {tickets.length === 0 ? <EmptyState title="No tickets" /> : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div key={t._id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border dark:border-darkBorder pb-3 last:border-0">
                <div>
                  <p className="font-medium">{CATEGORY_LABELS[t.category]} {t.room ? `— Room ${t.room.roomNumber}` : ''}</p>
                  <p className="text-sm text-text-secondary">{t.description}</p>
                  <div className="flex gap-2 mt-1">
                    <StatusBadge status={t.status === 'closed' || t.status === 'verified' ? 'completed' : t.status === 'open' ? 'pending' : 'confirmed'} />
                    {t.priority !== 'normal' && <span className="text-xs px-2 py-0.5 rounded-full bg-danger/10 text-danger capitalize">{t.priority}</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {t.status === 'open' && <Button className="!px-3 !py-1.5 text-xs" onClick={() => act(() => maintenanceService.startWork(t._id), 'Work started')}>Start Work</Button>}
                  {t.status === 'assigned' && <Button className="!px-3 !py-1.5 text-xs" onClick={() => act(() => maintenanceService.startWork(t._id), 'Work started')}>Start Work</Button>}
                  {t.status === 'in_progress' && <Button variant="gold" className="!px-3 !py-1.5 text-xs" onClick={() => setCompleteTarget(t._id)}>Mark Repaired</Button>}
                  {t.status === 'completed' && <Button variant="gold" className="!px-3 !py-1.5 text-xs" onClick={() => act(() => maintenanceService.verifyTicket(t._id), 'Repair verified')}>Verify</Button>}
                  {t.status === 'verified' && <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => act(() => maintenanceService.closeTicket(t._id), 'Ticket closed')}>Close</Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={!!completeTarget} onClose={() => setCompleteTarget(null)} title="Complete Repair">
        <form onSubmit={handleComplete} className="space-y-3">
          <Input placeholder="Repair notes" value={repairForm.repairNotes} onChange={(e) => setRepairForm({ ...repairForm, repairNotes: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Part used (optional)" value={repairForm.partName} onChange={(e) => setRepairForm({ ...repairForm, partName: e.target.value })} />
            <Input placeholder="Cost (₹)" type="number" value={repairForm.partCost} onChange={(e) => setRepairForm({ ...repairForm, partCost: e.target.value })} />
          </div>
          <Button variant="gold" className="w-full">Mark Completed</Button>
        </form>
      </Modal>
    </div>
  );
}
