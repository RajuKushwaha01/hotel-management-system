import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { serviceRequestService } from '../../services/serviceRequestService';
import { guestService } from '../../services/guestService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';

const TYPE_LABELS = {
  wake_up_call: 'Wake-up Call',
  taxi: 'Taxi Request',
  airport_pickup: 'Airport Pickup',
  extra_bed: 'Extra Bed',
  guest_request: 'Guest Request',
  complaint: 'Complaint',
};

export default function FrontDeskServices() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [guestQuery, setGuestQuery] = useState('');
  const [guestResults, setGuestResults] = useState([]);
  const [form, setForm] = useState({ guestId: '', type: 'wake_up_call', details: '', scheduledTime: '' });

  const load = () => {
    setLoading(true);
    serviceRequestService
      .getAll()
      .then((res) => setRequests(res.data.data))
      .catch(() => toast.error('Failed to load requests'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [])

  const searchGuest = async (q) => {
    setGuestQuery(q);
    if (q.length < 2) return setGuestResults([]);
    const res = await guestService.search({ query: q });
    setGuestResults(res.data.data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await serviceRequestService.create(form);
      toast.success('Request logged');
      setShowNew(false);
      setForm({ guestId: '', type: 'wake_up_call', details: '', scheduledTime: '' });
      setGuestQuery('');
      load();
    } catch {
      toast.error('Failed to log request');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await serviceRequestService.updateStatus(id, { status });
      toast.success('Status updated');
      load();
    } catch {
      toast.error('Failed to update');
    }
  };

  const columns = [
    { key: 'guest', label: 'Guest', render: (r) => `${r.guest?.firstName} ${r.guest?.lastName}` },
    { key: 'type', label: 'Type', render: (r) => TYPE_LABELS[r.type] },
    { key: 'details', label: 'Details' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) =>
        r.status !== 'completed' && (
          <select
            defaultValue={r.status}
            onChange={(e) => handleStatusChange(r._id, e.target.value)}
            className="text-xs px-2 py-1 rounded-lg border border-border dark:border-darkBorder bg-white dark:bg-darkBg"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display mb-1">Front Desk Services</h1>
          <p className="text-text-secondary text-sm">Wake-up calls, taxis, extra beds, complaints</p>
        </div>
        <Button variant="gold" onClick={() => setShowNew(true)} className="flex items-center gap-2">
          <Plus size={18} /> New Request
        </Button>
      </div>

      <Table columns={columns} data={requests} loading={loading} emptyMessage="No active requests" />

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Log Guest Request">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="relative">
            <Input placeholder="Search guest by name/email/phone..." value={guestQuery} onChange={(e) => searchGuest(e.target.value)} />
            {guestResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-darkCard border border-border dark:border-darkBorder rounded-xl shadow-xl max-h-40 overflow-y-auto">
                {guestResults.map((g) => (
                  <button
                    type="button"
                    key={g._id}
                    onClick={() => { setForm({ ...form, guestId: g._id }); setGuestQuery(`${g.firstName} ${g.lastName}`); setGuestResults([]); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    {g.firstName} {g.lastName} — {g.email}
                  </button>
                ))}
              </div>
            )}
          </div>

          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg"
          >
            {Object.entries(TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <Input placeholder="Details (e.g. '6:30 AM wake-up')" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} required />
          <Input label="Scheduled Time (optional)" type="datetime-local" value={form.scheduledTime} onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })} />

          <Button variant="gold" className="w-full" disabled={!form.guestId}>Log Request</Button>
        </form>
      </Modal>
    </div>
  );
}
