import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { customerService } from '../../services/customerService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import QRCodeCard from '../../components/common/QRCodeCard';

export default function Invoices() {
  const [bookings, setBookings] = useState([]);
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    customerService.getMyBookings().then((res) => setBookings(res.data.data.filter((b) => b.status === 'completed' || b.status === 'checked_in')));
  }, []);

  const viewInvoice = async (bookingId) => {
    try {
      const res = await customerService.getInvoice(bookingId);
      setInvoice(res.data.data);
    } catch {
      toast.error('Invoice not available for this booking');
    }
  };

  const columns = [
    { key: 'room', label: 'Room', render: (r) => r.room?.roomNumber },
    { key: 'checkIn', label: 'Stay Date', render: (r) => new Date(r.checkIn).toLocaleDateString() },
    { key: 'totalAmount', label: 'Amount', render: (r) => `₹${r.totalAmount.toLocaleString()}` },
    { key: 'actions', label: '', render: (r) => <Button className="!px-3 !py-1.5 text-xs" onClick={() => viewInvoice(r._id)}>View Invoice</Button> },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">Invoices</h1>
      <p className="text-text-secondary text-sm mb-6">Download and review your billing history</p>
      <Table columns={columns} data={bookings} emptyMessage="No invoices available yet" />

      <Modal open={!!invoice} onClose={() => setInvoice(null)} title="Invoice">
        {invoice && (
          <div className="space-y-4">
            {invoice.verificationCode && (
              <div className="p-4 rounded-xl bg-bgLight dark:bg-darkBg flex items-center justify-center">
                <QRCodeCard
                  title="Invoice Verification"
                  value={`${window.location.origin}/verify-invoice/${invoice.verificationCode}`}
                  subtitle="Scan to verify authenticity"
                  filename="invoice-verification-qr.png"
                />
              </div>
            )}

            <div className="space-y-2 text-sm">
              {invoice.charges.map((c) => (
                <div key={c._id} className="flex justify-between border-b border-border dark:border-darkBorder pb-2">
                  <span>{c.description}</span><span>₹{c.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-2 text-lg"><span>Total</span><span>₹{invoice.totals.totalCharges.toLocaleString()}</span></div>
              <div className="flex justify-between text-success"><span>Paid</span><span>₹{invoice.totals.totalPaid.toLocaleString()}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
