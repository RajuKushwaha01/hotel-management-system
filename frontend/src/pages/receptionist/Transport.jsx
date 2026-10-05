import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { transportService } from '../../services/transportService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';

const TYPES = { airport_pickup: 'Airport Pickup', airport_drop: 'Airport Drop', taxi: 'Taxi', hotel_vehicle: 'Hotel Vehicle' };

export default function Transport() {
  const [requests, setRequests] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [assignTarget, setAssignTarget] = useState(null);
  const [form, setForm] = useState({ guestId: '', type: 'taxi', scheduledDateTime: '', pickupLocation: '', dropLocation: '' });
  const [assignForm, setAssignForm] = useState({ vehicle: '', driverName: '', driverPhone: '', cost: '' });

  const load = () => transportService.getAll().then((res) => setRequests(res.data.data));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await transportService.create(form);
      toast.success('Transport request created');
      setShowNew(false);
      setForm({ guestId: '', type: 'taxi', scheduledDateTime: '', pickupLocation: '', dropLocation: '' });
      load();
    } catch { toast.error('Failed to create request'); }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await transportService.assignDriver(assignTarget, { ...assignForm, cost: Number(assignForm.cost) });
      toast.success('Driver assigned');
      setAssignTarget(null);
      setAssignForm({ vehicle: '', driverName: '', driverPhone: '', cost: '' });
      load();
    } catch { toast.error('Failed to assign'); }
  };

  const handleComplete = async (id) => {
    try {
      await transportService.updateStatus(id, 'completed');
      toast.success('Marked completed and charged to folio');
      load();
    } catch { toast.error('Failed to update'); }
  };

  const columns = [
    { key: 'guest', label: 'Guest', render: (r) => `${r.guest?.firstName} ${r.guest?.lastName}` },
    { key: 'type', label: 'Type', render: (r) => TYPES[r.type] },
    { key: 'route', label: 'Route', render: (r) => `${r.pickupLocation} → ${r.dropLocation}` },
    { key: 'scheduledDateTime', label: 'Scheduled', render: (r) => new Date(r.scheduledDateTime).toLocaleString() },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status === 'completed' ? 'completed' : 'pending'} /> },
    {
      key: 'actions', label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          {r.status === 'requested' && <Button className="!px-3 !py-1.5 text-xs" onClick={() => setAssignTarget(r._id)}>Assign Driver</Button>}
          {r.status === 'assigned' && <Button variant="gold" className="!px-3 !py-1.5 text-xs" onClick={() => handleComplete(r._id)}>Mark Completed</Button>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-display mb-1">Transport Management</h1><p className="text-text-secondary text-sm">Airport pickups, taxis, and hotel vehicle assignments</p></div>
        <Button variant="gold" onClick={() => setShowNew(true)} className="flex items-center gap-2"><Plus size={18} /> New Request</Button>
      </div>

      <Table columns={columns} data={requests} emptyMessage="No transport requests" />

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Transport Request">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input placeholder="Guest ID" value={form.guestId} onChange={(e) => setForm({ ...form, guestId: e.target.value })} required />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg">
            {Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <Input label="Scheduled Date & Time" type="datetime-local" value={form.scheduledDateTime} onChange={(e) => setForm({ ...form, scheduledDateTime: e.target.value })} required />
          <Input placeholder="Pickup location" value={form.pickupLocation} onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })} required />
          <Input placeholder="Drop location" value={form.dropLocation} onChange={(e) => setForm({ ...form, dropLocation: e.target.value })} required />
          <Button variant="gold" className="w-full">Create Request</Button>
        </form>
      </Modal>

      <Modal open={!!assignTarget} onClose={() => setAssignTarget(null)} title="Assign Driver & Vehicle">
        <form onSubmit={handleAssign} className="space-y-3">
          <Input placeholder="Vehicle (e.g. Toyota Innova - KA01AB1234)" value={assignForm.vehicle} onChange={(e) => setAssignForm({ ...assignForm, vehicle: e.target.value })} required />
          <Input placeholder="Driver name" value={assignForm.driverName} onChange={(e) => setAssignForm({ ...assignForm, driverName: e.target.value })} required />
          <Input placeholder="Driver phone" value={assignForm.driverPhone} onChange={(e) => setAssignForm({ ...assignForm, driverPhone: e.target.value })} required />
          <Input placeholder="Cost (₹)" type="number" value={assignForm.cost} onChange={(e) => setAssignForm({ ...assignForm, cost: e.target.value })} required />
          <Button variant="gold" className="w-full">Assign</Button>
        </form>
      </Modal>
    </div>
  );
}
