import { useEffect, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { receptionistService } from '../../services/receptionistService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const emptyForm = {
  checkIn: '', checkOut: '', roomId: '', guests: 1, source: 'walk_in',
  totalAmount: '', specialRequests: '',
  newGuest: { firstName: '', lastName: '', email: '', phone: '' },
};

export default function Reservations() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [cancelTarget, setCancelTarget] = useState(null);

  const load = (query = '') => {
    setLoading(true);
    receptionistService
      .searchBookings({ query })
      .then((res) => setBookings(res.data.data))
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => load(), []);

  const handleSearch = (e) => {
    e.preventDefault();
    load(search);
  };

  const handleCheckAvailability = async () => {
    if (!form.checkIn || !form.checkOut) return toast.error('Select check-in and check-out dates first');
    try {
      const res = await receptionistService.checkAvailability({ checkIn: form.checkIn, checkOut: form.checkOut });
      setAvailableRooms(res.data.data);
      if (res.data.data.length === 0) toast('No rooms available for these dates', { icon: '⚠️' });
    } catch {
      toast.error('Failed to check availability');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await receptionistService.createBooking({
        ...form,
        totalAmount: Number(form.totalAmount),
      });
      toast.success('Reservation created');
      setShowNew(false);
      setForm(emptyForm);
      setAvailableRooms([]);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create reservation');
    }
  };

  const handleCancel = async () => {
    try {
      await receptionistService.cancelBooking(cancelTarget);
      toast.success('Reservation cancelled');
      load();
    } catch {
      toast.error('Failed to cancel');
    }
  };

  const columns = [
    { key: 'guest', label: 'Guest', render: (r) => `${r.guest?.firstName} ${r.guest?.lastName}` },
    { key: 'room', label: 'Room', render: (r) => `${r.room?.roomNumber} · ${r.room?.roomType}` },
    { key: 'checkIn', label: 'Check-in', render: (r) => new Date(r.checkIn).toLocaleDateString() },
    { key: 'checkOut', label: 'Check-out', render: (r) => new Date(r.checkOut).toLocaleDateString() },
    { key: 'source', label: 'Source', render: (r) => <span className="capitalize text-xs">{r.source.replace('_', ' ')}</span> },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) =>
        !['completed', 'cancelled'].includes(r.status) && (
          <button onClick={() => setCancelTarget(r._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-danger">
            <X size={16} />
          </button>
        ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-display mb-1">Reservations</h1>
          <p className="text-text-secondary text-sm">Search, modify and manage bookings</p>
        </div>
        <Button variant="gold" onClick={() => setShowNew(true)} className="flex items-center gap-2 shrink-0">
          <Plus size={18} /> New Reservation
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-5 max-w-md">
        <Input placeholder="Search by guest, room or booking ID..." icon={Search} value={search} onChange={(e) => setSearch(e.target.value)} />
        <Button type="submit" variant="outline">Search</Button>
      </form>

      <Table columns={columns} data={bookings} loading={loading} emptyMessage="No reservations found" />

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Reservation" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Check-in" type="date" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} required />
            <Input label="Check-out" type="date" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} required />
          </div>
          <Button type="button" variant="outline" onClick={handleCheckAvailability}>Check Availability</Button>

          {availableRooms.length > 0 && (
            <select
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg"
              required
            >
              <option value="">Select a room</option>
              {availableRooms.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.roomNumber} · {r.roomType} · ₹{r.pricePerNight}/night
                </option>
              ))}
            </select>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input label="Guests" type="number" min="1" value={form.guests} onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })} />
            <Input label="Total Amount (₹)" type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} required />
          </div>

          <select
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg"
          >
            <option value="walk_in">Walk-in</option>
            <option value="phone">Phone Booking</option>
            <option value="online">Online</option>
            <option value="group">Group Booking</option>
          </select>

          <p className="text-sm font-medium pt-2">Guest Details</p>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="First name" value={form.newGuest.firstName} onChange={(e) => setForm({ ...form, newGuest: { ...form.newGuest, firstName: e.target.value } })} required />
            <Input placeholder="Last name" value={form.newGuest.lastName} onChange={(e) => setForm({ ...form, newGuest: { ...form.newGuest, lastName: e.target.value } })} required />
          </div>
          <Input type="email" placeholder="Email" value={form.newGuest.email} onChange={(e) => setForm({ ...form, newGuest: { ...form.newGuest, email: e.target.value } })} required />
          <Input placeholder="Phone" value={form.newGuest.phone} onChange={(e) => setForm({ ...form, newGuest: { ...form.newGuest, phone: e.target.value } })} required />

          <Input placeholder="Special requests (optional)" value={form.specialRequests} onChange={(e) => setForm({ ...form, specialRequests: e.target.value })} />

          <Button variant="gold" className="w-full">Create Reservation</Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel this reservation?"
        message="The guest will be notified and the room will become available for other bookings."
      />
    </div>
  );
}
