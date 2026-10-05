import { useEffect, useState } from 'react';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { receptionistService } from '../../services/receptionistService';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';

export default function CheckIn() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState({ idType: 'passport', idNumber: '', advanceAmount: '', advanceMethod: 'cash' });

  const load = () => {
    setLoading(true);
    receptionistService
      .searchBookings({ status: 'confirmed' })
      .then((res) => setBookings(res.data.data))
      .catch(() => toast.error('Failed to load arrivals'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCheckIn = async (e) => {
    e.preventDefault();
    try {
      await receptionistService.checkIn(target._id, {
        ...form,
        advanceAmount: form.advanceAmount ? Number(form.advanceAmount) : undefined,
      });
      toast.success(`${target.guest.firstName} checked in — Room ${target.room.roomNumber}`);
      setTarget(null);
      setForm({ idType: 'passport', idNumber: '', advanceAmount: '', advanceMethod: 'cash' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    }
  };

  const columns = [
    { key: 'guest', label: 'Guest', render: (r) => `${r.guest?.firstName} ${r.guest?.lastName}` },
    { key: 'room', label: 'Room', render: (r) => `${r.room?.roomNumber} · ${r.room?.roomType}` },
    { key: 'checkIn', label: 'Expected', render: (r) => new Date(r.checkIn).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <Button variant="gold" className="!px-3 !py-1.5 text-xs flex items-center gap-1" onClick={() => setTarget(r)}>
          <LogIn size={14} /> Check In
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">Check-In</h1>
      <p className="text-text-secondary text-sm mb-6">Verify guest details and assign rooms</p>

      <Table columns={columns} data={bookings} loading={loading} emptyMessage="No pending arrivals" />

      <Modal open={!!target} onClose={() => setTarget(null)} title={`Check In — ${target?.guest?.firstName} ${target?.guest?.lastName}`}>
        <form onSubmit={handleCheckIn} className="space-y-4">
          <p className="text-sm text-text-secondary">Room {target?.room?.roomNumber} · {target?.room?.roomType}</p>

          <select
            value={form.idType}
            onChange={(e) => setForm({ ...form, idType: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg"
          >
            <option value="passport">Passport</option>
            <option value="national_id">National ID</option>
            <option value="driving_license">Driving License</option>
            <option value="other">Other</option>
          </select>
          <Input placeholder="ID Number" value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} required />

          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Advance amount (₹)" type="number" value={form.advanceAmount} onChange={(e) => setForm({ ...form, advanceAmount: e.target.value })} />
            <select
              value={form.advanceMethod}
              onChange={(e) => setForm({ ...form, advanceMethod: e.target.value })}
              className="px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          <Button variant="gold" className="w-full">Confirm Check-In</Button>
        </form>
      </Modal>
    </div>
  );
}
