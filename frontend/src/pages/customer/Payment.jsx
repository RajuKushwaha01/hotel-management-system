import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const METHODS = [
  { key: 'card', label: 'Credit / Debit Card', icon: CreditCard },
  { key: 'upi', label: 'UPI', icon: Smartphone },
  { key: 'cash', label: 'Pay at Hotel', icon: Wallet },
];

// Demo/manual payment, matching the spec's "Payment / Demo Payment" step. No real gateway is wired —
// this simulates a processing delay then posts a payment against the booking's folio if one exists,
// or simply records the intent for front-desk collection when "Pay at Hotel" is chosen.
export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [method, setMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '' });

  const handlePay = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await new Promise((r) => setTimeout(r, 1400)); // simulated gateway delay
      if (method !== 'cash') {
        await api.post(`/folios/${bookingId}/payment`, { amount: 0, method, note: 'Guest self-service payment (demo)' }).catch(() => {});
      }
      navigate(`/payment/${bookingId}/result?status=success&method=${method}`);
    } catch {
      navigate(`/payment/${bookingId}/result?status=failed`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 animate-fade-in">
      <h1 className="font-display text-2xl mb-1 text-center">Complete Payment</h1>
      <p className="text-text-secondary text-sm text-center mb-8">Booking #{bookingId.slice(-6).toUpperCase()}</p>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {METHODS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMethod(key)}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 text-xs font-medium transition ${method === key ? 'border-gold bg-gold/5' : 'border-border dark:border-darkBorder'}`}
          >
            <Icon size={20} className={method === key ? 'text-gold' : 'text-text-secondary'} />
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handlePay} className="space-y-3">
        {method === 'card' && (
          <>
            <input required placeholder="Card number" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-border dark:border-darkBorder bg-transparent" />
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="MM/YY" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: e.target.value })} className="px-4 py-3 rounded-xl border border-border dark:border-darkBorder bg-transparent" />
              <input required placeholder="CVV" value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} className="px-4 py-3 rounded-xl border border-border dark:border-darkBorder bg-transparent" />
            </div>
          </>
        )}
        {method === 'upi' && <input required placeholder="yourname@upi" className="w-full px-4 py-3 rounded-xl border border-border dark:border-darkBorder bg-transparent" />}
        {method === 'cash' && <p className="text-sm text-text-secondary text-center py-4">You'll pay the full amount at the front desk during check-in.</p>}

        <button disabled={processing} className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-gold to-goldLight text-navy font-semibold disabled:opacity-60">
          {processing ? 'Processing...' : method === 'cash' ? 'Confirm' : 'Pay Now'}
        </button>
      </form>
      <p className="text-center text-xs text-text-secondary mt-4">🔒 This is a demo checkout — no real charge is made.</p>
    </div>
  );
}
