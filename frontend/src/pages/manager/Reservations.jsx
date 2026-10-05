import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { managerService } from '../../services/managerService';
import Table from '../../components/ui/Table';
import StatusBadge from '../../components/ui/StatusBadge';

export default function ManagerReservations() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    managerService
      .getBookings()
      .then((res) => setBookings(res.data.data))
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    try {
      await managerService.approveBooking(id);
      toast.success('Booking approved');
      load();
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleCancel = async (id) => {
    try {
      await managerService.cancelBooking(id);
      toast.success('Booking cancelled');
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
    { key: 'totalAmount', label: 'Amount', render: (r) => `₹${r.totalAmount.toLocaleString()}` },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) =>
        r.status === 'pending' ? (
          <div className="flex gap-2">
            <button onClick={() => handleApprove(r._id)} className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20" title="Approve">
              <Check size={16} />
            </button>
            <button onClick={() => handleCancel(r._id)} className="p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20" title="Cancel">
              <X size={16} />
            </button>
          </div>
        ) : (
          <span className="text-text-secondary text-xs">—</span>
        ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">Reservations</h1>
      <p className="text-text-secondary text-sm mb-6">Review, approve or cancel guest bookings</p>
      <Table columns={columns} data={bookings} loading={loading} emptyMessage="No reservations found" />
    </div>
  );
}
