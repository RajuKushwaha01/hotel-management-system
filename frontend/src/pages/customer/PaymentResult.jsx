import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';

export default function PaymentResult() {
  const { bookingId } = useParams();
  const [params] = useSearchParams();
  const success = params.get('status') === 'success';
  const method = params.get('method');

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center animate-fade-in">
      {success ? (
        <>
          <CheckCircle size={56} className="text-success mx-auto mb-4" />
          <h1 className="font-display text-2xl mb-2">Payment Successful</h1>
          <p className="text-text-secondary mb-8">
            {method === 'cash' ? 'Your payment method is set to Pay at Hotel.' : 'Your payment has been recorded and a receipt has been emailed to you.'}
          </p>
        </>
      ) : (
        <>
          <XCircle size={56} className="text-danger mx-auto mb-4" />
          <h1 className="font-display text-2xl mb-2">Payment Failed</h1>
          <p className="text-text-secondary mb-8">Something went wrong. No amount was charged — please try again.</p>
        </>
      )}
      <div className="flex gap-3 justify-center">
        <Link to="/customer/bookings" className="px-5 py-2.5 rounded-xl border border-border dark:border-darkBorder text-sm font-medium">My Bookings</Link>
        {!success && <Link to={`/payment/${bookingId}`} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-goldLight text-navy text-sm font-semibold">Try Again</Link>}
      </div>
    </div>
  );
}
