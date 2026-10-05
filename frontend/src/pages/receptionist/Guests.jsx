import { useEffect, useState } from 'react';
import { Plus, Search, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { guestService } from '../../services/guestService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';

const emptyForm = { firstName: '', lastName: '', email: '', phone: '', address: '', preferences: '' };

export default function Guests() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState(null);

  const load = (query = '') => {
    setLoading(true);
    guestService
      .search({ query })
      .then((res) => setGuests(res.data.data))
      .catch(() => toast.error('Failed to load guests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await guestService.create(form);
      toast.success('Guest profile created');
      setShowNew(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create guest');
    }
  };

  const viewProfile = async (guest) => {
    setProfile(guest);
    try {
      const res = await guestService.getHistory(guest._id);
      setHistory(res.data.data);
    } catch {
      toast.error('Failed to load guest history');
    }
  };

  const columns = [
    { key: 'name', label: 'Name', render: (r) => `${r.firstName} ${r.lastName}` },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'membershipLevel', label: 'Membership', render: (r) => <StatusBadge status={r.membershipLevel?.toLowerCase() || 'bronze'} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <button onClick={() => viewProfile(r)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display mb-1">Guests</h1>
          <p className="text-text-secondary text-sm">Guest profiles and stay history</p>
        </div>
        <Button variant="gold" onClick={() => setShowNew(true)} className="flex items-center gap-2">
          <Plus size={18} /> New Guest
        </Button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); load(search); }} className="flex gap-3 mb-5 max-w-md">
        <Input placeholder="Search guests..." icon={Search} value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <Table columns={columns} data={guests} loading={loading} emptyMessage="No guests found" />

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Guest Profile">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <Input placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </div>
          <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input placeholder="Preferences (e.g. high floor, non-smoking)" value={form.preferences} onChange={(e) => setForm({ ...form, preferences: e.target.value })} />
          <Button variant="gold" className="w-full">Create Guest</Button>
        </form>
      </Modal>

      <Modal open={!!profile} onClose={() => { setProfile(null); setHistory(null); }} title={`${profile?.firstName} ${profile?.lastName}`} size="lg">
        {history && (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="text-center p-3 rounded-xl bg-bgLight dark:bg-darkBg">
                <p className="text-2xl font-bold">{history.summary.totalStays}</p>
                <p className="text-xs text-text-secondary">Completed Stays</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-bgLight dark:bg-darkBg">
                <p className="text-2xl font-bold">{history.summary.totalBookings}</p>
                <p className="text-xs text-text-secondary">Total Bookings</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-bgLight dark:bg-darkBg">
                <p className="text-2xl font-bold">₹{history.summary.totalSpent.toLocaleString()}</p>
                <p className="text-xs text-text-secondary">Total Spent</p>
              </div>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {history.bookings.map((b) => (
                <div key={b._id} className="flex justify-between text-sm border-b border-border dark:border-darkBorder pb-2">
                  <span>Room {b.room?.roomNumber} · {new Date(b.checkIn).toLocaleDateString()}</span>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
