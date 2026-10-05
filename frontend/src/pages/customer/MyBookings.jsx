import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { customerService } from '../../services/customerService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusBadge from '../../components/ui/StatusBadge';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [cancelTarget, setCancelTarget] = useState(null);

  const load = () => customerService.getMyBookings().then((res) => setBookings(res.data.data));
  useEffect(() => { load(); }, []);

  const handleCancel = async () => {
    try {
      await customerService.cancelBooking(cancelTarget);
      toast.success('Booking cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot cancel this booking');
    }
  };

  const columns = [
    { key: 'room', label: 'Room', render: (r) => `${r.room?.roomNumber} · ${r.room?.roomType}` },
    { key: 'checkIn', label: 'Check-in', render: (r) => new Date(r.checkIn).toLocaleDateString() },
    { key: 'checkOut', label: 'Check-out', render: (r) => new Date(r.checkOut).toLocaleDateString() },
    { key: 'totalAmount', label: 'Amount', render: (r) => `₹${r.totalAmount.toLocaleString()}` },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions', label: '',
      render: (r) => ['pending', 'confirmed'].includes(r.status) && (
        <Button variant="outline" className="!px-3 !py-1.5 text-xs !text-danger !border-danger" onClick={() => setCancelTarget(r._id)}>Cancel</Button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">My Bookings</h1>
      <p className="text-text-secondary text-sm mb-6">View and manage your reservations</p>
      <Table columns={columns} data={bookings} emptyMessage="You have no bookings yet" />
      <ConfirmDialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} onConfirm={handleCancel} title="Cancel this booking?" message="Free cancellation is only available up to 24 hours before check-in." />
    </div>
  );
}
