import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Tag, IndianRupee, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { folioService } from '../../services/folioService';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Tabs from '../../components/ui/Tabs';
import QRCodeCard from '../../components/common/QRCodeCard';

const CATEGORY_LABELS = {
  room: 'Room Charges', restaurant: 'Restaurant', room_service: 'Room Service',
  laundry: 'Laundry', extra_bed: 'Extra Bed', transport: 'Transport',
  event: 'Event', misc: 'Other Services',
};

export default function FolioDetail() {
  const { bookingId } = useParams();
  const [folio, setFolio] = useState(null);
  const [showCharge, setShowCharge] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [chargeForm, setChargeForm] = useState({ type: 'misc', description: '', amount: '' });
  const [discountForm, setDiscountForm] = useState({ description: '', amount: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash', note: '' });

  const load = () => folioService.get(bookingId).then((res) => setFolio(res.data.data)).catch(() => toast.error('Failed to load folio'));
  useEffect(load, [bookingId]);

  const submitCharge = async (e) => {
    e.preventDefault();
    try {
      await folioService.addCharge(bookingId, { ...chargeForm, amount: Number(chargeForm.amount) });
      toast.success('Charge added');
      setShowCharge(false);
      setChargeForm({ type: 'misc', description: '', amount: '' });
      load();
    } catch { toast.error('Failed to add charge'); }
  };

  const submitDiscount = async (e) => {
    e.preventDefault();
    try {
      await folioService.applyDiscount(bookingId, { ...discountForm, amount: Number(discountForm.amount) });
      toast.success('Discount applied');
      setShowDiscount(false);
      setDiscountForm({ description: '', amount: '' });
      load();
    } catch { toast.error('Failed to apply discount'); }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    try {
      await folioService.collectPayment(bookingId, { ...paymentForm, amount: Number(paymentForm.amount) });
      toast.success('Payment recorded');
      setShowPayment(false);
      setPaymentForm({ amount: '', method: 'cash', note: '' });
      load();
    } catch { toast.error('Failed to record payment'); }
  };

  if (!folio) return null;
  const { breakdown } = folio;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display mb-1">Guest Folio</h1>
          <p className="text-text-secondary text-sm">{folio.guest?.firstName} {folio.guest?.lastName}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDiscount(true)} className="flex items-center gap-1 !px-3 !py-2 text-sm"><Tag size={16} /> Discount</Button>
          <Button variant="outline" onClick={() => setShowCharge(true)} className="flex items-center gap-1 !px-3 !py-2 text-sm"><Plus size={16} /> Charge</Button>
          <Button variant="gold" onClick={() => setShowPayment(true)} className="flex items-center gap-1 !px-3 !py-2 text-sm"><IndianRupee size={16} /> Payment</Button>
        </div>
      </div>

      {/* Category Breakdown — exactly the formula: Room + Restaurant + Room Service + Laundry + Extra Bed + Transport + Other + Tax - Discount - Payments = Balance */}
      <Card className="mb-6">
        <h3 className="font-semibold mb-4">Charge Breakdown</h3>

        {folio.verificationCode && (
          <div className="mb-4 p-4 rounded-xl bg-bgLight dark:bg-darkBg flex items-center gap-4">
            <QRCodeCard
              title="Invoice Verification"
              value={`${window.location.origin}/verify-invoice/${folio.verificationCode}`}
              subtitle="Scan to verify authenticity"
              filename="invoice-verification-qr.png"
            />
          </div>
        )}

        <div className="space-y-2 text-sm">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            breakdown.byCategory[key] !== 0 && (
              <div key={key} className="flex justify-between">
                <span>{label}</span>
                <span>₹{breakdown.byCategory[key].toLocaleString()}</span>
              </div>
            )
          ))}
          <div className="flex justify-between text-text-secondary border-t border-border dark:border-darkBorder pt-2">
            <span>Subtotal</span><span>₹{breakdown.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({folio.taxPercent}%)</span><span>+ ₹{breakdown.tax.toLocaleString()}</span>
          </div>
          {breakdown.discount > 0 && (
            <div className="flex justify-between text-success">
              <span>Discount</span><span>− ₹{breakdown.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-medium pt-2 border-t border-border dark:border-darkBorder">
            <span>Total Charges</span><span>₹{breakdown.totalCharges.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-success">
            <span>Total Paid</span><span>− ₹{breakdown.totalPaid.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-border dark:border-darkBorder">
            <span>Outstanding Balance</span>
            <span className={breakdown.balance > 0 ? 'text-danger' : 'text-success'}>₹{breakdown.balance.toLocaleString()}</span>
          </div>
        </div>
      </Card>

      <Tabs
        tabs={[
          {
            id: 'charges', label: 'All Charges',
            content: (
              <div className="space-y-2">
                {folio.charges.map((c) => (
                  <div key={c._id} className="flex justify-between text-sm border-b border-border dark:border-darkBorder pb-2">
                    <div>
                      <p>{c.description}</p>
                      <p className="text-xs text-text-secondary">{CATEGORY_LABELS[c.type] || c.type} · {new Date(c.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={c.amount < 0 ? 'text-success' : ''}>₹{c.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ),
          },
          {
            id: 'payments', label: 'Payments',
            content: (
              <div className="space-y-2">
                {folio.payments.map((p) => (
                  <div key={p._id} className="flex justify-between text-sm border-b border-border dark:border-darkBorder pb-2">
                    <div>
                      <p className="capitalize">{p.method} {p.note && `— ${p.note}`}</p>
                      <p className="text-xs text-text-secondary">{new Date(p.createdAt).toLocaleString()}</p>
                    </div>
                    <span className="text-success">₹{p.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ),
          },
        ]}
      />

      <Modal open={showCharge} onClose={() => setShowCharge(false)} title="Add Charge">
        <form onSubmit={submitCharge} className="space-y-3">
          <select value={chargeForm.type} onChange={(e) => setChargeForm({ ...chargeForm, type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg">
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <Input placeholder="Description" value={chargeForm.description} onChange={(e) => setChargeForm({ ...chargeForm, description: e.target.value })} required />
          <Input placeholder="Amount (₹)" type="number" value={chargeForm.amount} onChange={(e) => setChargeForm({ ...chargeForm, amount: e.target.value })} required />
          <Button variant="gold" className="w-full">Add Charge</Button>
        </form>
      </Modal>

      <Modal open={showDiscount} onClose={() => setShowDiscount(false)} title="Apply Discount" size="sm">
        <form onSubmit={submitDiscount} className="space-y-3">
          <Input placeholder="Reason for discount" value={discountForm.description} onChange={(e) => setDiscountForm({ ...discountForm, description: e.target.value })} required />
          <Input placeholder="Amount (₹)" type="number" value={discountForm.amount} onChange={(e) => setDiscountForm({ ...discountForm, amount: e.target.value })} required />
          <Button variant="gold" className="w-full">Apply Discount</Button>
        </form>
      </Modal>

      <Modal open={showPayment} onClose={() => setShowPayment(false)} title="Collect Payment" size="sm">
        <form onSubmit={submitPayment} className="space-y-3">
          <Input placeholder="Amount (₹)" type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
          <select value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg">
            <option value="cash">Cash</option><option value="card">Card</option><option value="upi">UPI</option><option value="bank_transfer">Bank Transfer</option>
          </select>
          <Input placeholder="Note (optional)" value={paymentForm.note} onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })} />
          <Button variant="gold" className="w-full">Record Payment</Button>
        </form>
      </Modal>
    </div>
  );
}
