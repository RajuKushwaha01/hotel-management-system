import { useEffect, useState } from 'react';
import { LogOut, Plus, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import { receptionistService } from '../../services/receptionistService';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';

export default function CheckOut() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [target, setTarget] = useState(null);
  const [folio, setFolio] = useState(null);
  const [chargeForm, setChargeForm] = useState({ type: 'room_service', description: '', amount: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash', note: '' });

  const load = () => {
    setLoading(true);
    receptionistService
      .searchBookings({ status: 'checked_in' })
      .then((res) => setBookings(res.data.data))
      .catch(() => toast.error('Failed to load in-house guests'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openFolio = async (booking) => {
    setTarget(booking);
    try {
      const res = await receptionistService.getFolio(booking._id);
      setFolio(res.data.data);
    } catch {
      toast.error('Failed to load folio');
    }
  };

  const refreshFolio = async () => {
    const res = await receptionistService.getFolio(target._id);
    setFolio(res.data.data);
  };

  const handleAddCharge = async (e) => {
    e.preventDefault();
    try {
      await receptionistService.addCharge(target._id, { ...chargeForm, amount: Number(chargeForm.amount) });
      toast.success('Charge added');
      setChargeForm({ type: 'room_service', description: '', amount: '' });
      refreshFolio();
    } catch {
      toast.error('Failed to add charge');
    }
  };

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    try {
      await receptionistService.collectPayment(target._id, { ...paymentForm, amount: Number(paymentForm.amount) });
      toast.success('Payment recorded');
      setPaymentForm({ amount: '', method: 'cash', note: '' });
      refreshFolio();
    } catch {
      toast.error('Failed to record payment');
    }
  };

  const handleCheckOut = async () => {
    try {
      await receptionistService.checkOut(target._id);
      toast.success('Guest checked out successfully');
      setTarget(null);
      setFolio(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Balance must be settled before check-out');
    }
  };

  const columns = [
    { key: 'guest', label: 'Guest', render: (r) => `${r.guest?.firstName} ${r.guest?.lastName}` },
    { key: 'room', label: 'Room', render: (r) => `${r.room?.roomNumber} · ${r.room?.roomType}` },
    { key: 'checkOut', label: 'Expected Departure', render: (r) => new Date(r.checkOut).toLocaleDateString() },
    {
      key: 'actions',
      label: 'Actions',
      render: (r) => (
        <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => openFolio(r)}>
          View Folio
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">Check-Out</h1>
      <p className="text-text-secondary text-sm mb-6">Review folios, collect payments and check guests out</p>

      <Table columns={columns} data={bookings} loading={loading} emptyMessage="No guests currently in-house" />

      <Modal open={!!target} onClose={() => { setTarget(null); setFolio(null); }} title={`Folio — ${target?.guest?.firstName} ${target?.guest?.lastName}`} size="lg">
        {folio && (
          <Tabs
            tabs={[
              {
                id: 'summary',
                label: 'Summary',
                content: (
                  <div className="space-y-2 text-sm">
                    {folio.charges.map((c) => (
                      <div key={c._id} className="flex justify-between border-b border-border dark:border-darkBorder pb-2">
                        <span className="capitalize">{c.description}</span>
                        <span>₹{c.amount.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 font-medium">
                      <span>Total Charges</span><span>₹{folio.totals.totalCharges.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-success">
                      <span>Total Paid</span><span>₹{folio.totals.totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-border dark:border-darkBorder">
                      <span>Balance Due</span>
                      <span className={folio.totals.balance > 0 ? 'text-danger' : 'text-success'}>
                        ₹{folio.totals.balance.toLocaleString()}
                      </span>
                    </div>
                    <Button
                      variant="gold"
                      className="w-full mt-4 flex items-center justify-center gap-2"
                      onClick={handleCheckOut}
                      disabled={folio.totals.balance > 0}
                    >
                      <LogOut size={16} /> Complete Check-Out
                    </Button>
                  </div>
                ),
              },
              {
                id: 'charge',
                label: 'Add Charge',
                content: (
                  <form onSubmit={handleAddCharge} className="space-y-3">
                    <select
                      value={chargeForm.type}
                      onChange={(e) => setChargeForm({ ...chargeForm, type: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg"
                    >
                      <option value="room_service">Room Service</option>
                      <option value="laundry">Laundry</option>
                      <option value="extra_bed">Extra Bed</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="transport">Transport</option>
                      <option value="misc">Miscellaneous</option>
                    </select>
                    <Input placeholder="Description" value={chargeForm.description} onChange={(e) => setChargeForm({ ...chargeForm, description: e.target.value })} required />
                    <Input placeholder="Amount (₹)" type="number" value={chargeForm.amount} onChange={(e) => setChargeForm({ ...chargeForm, amount: e.target.value })} required />
                    <Button variant="gold" className="w-full flex items-center justify-center gap-2">
                      <Plus size={16} /> Add Charge
                    </Button>
                  </form>
                ),
              },
              {
                id: 'payment',
                label: 'Collect Payment',
                content: (
                  <form onSubmit={handleCollectPayment} className="space-y-3">
                    <Input placeholder="Amount (₹)" type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
                    <select
                      value={paymentForm.method}
                      onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                    <Input placeholder="Note (optional)" value={paymentForm.note} onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })} />
                    <Button variant="gold" className="w-full flex items-center justify-center gap-2">
                      <IndianRupee size={16} /> Record Payment
                    </Button>
                  </form>
                ),
              },
            ]}
          />
        )}
      </Modal>
    </div>
  );
}
