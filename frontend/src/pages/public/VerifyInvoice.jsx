import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { qrService } from '../../services/qrService';

export default function VerifyInvoice() {
  const { code } = useParams();
  const [result, setResult] = useState(null);

  useEffect(() => {
    qrService.verifyInvoice(code).then((res) => setResult(res.data.data)).catch(() => setResult({ valid: false }));
  }, [code]);

  if (!result) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy via-deepNavy to-black px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center animate-fade-in">
        {result.valid ? (
          <>
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={28} className="text-success" />
            </div>
            <h1 className="text-xl font-display text-white mb-1">Invoice Verified</h1>
            <p className="text-white/60 text-sm mb-6">This is a genuine invoice issued by GrandVista Hotel.</p>

            <div className="text-left space-y-2 text-sm text-white/80 bg-white/5 rounded-xl p-4">
              <div className="flex justify-between"><span className="text-white/50">Reference</span><span className="font-mono">{result.invoiceRef}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Guest</span><span>{result.guestName}</span></div>
              {result.roomType && <div className="flex justify-between"><span className="text-white/50">Room Type</span><span className="capitalize">{result.roomType}</span></div>}
              <div className="flex justify-between"><span className="text-white/50">Total</span><span>₹{result.totalAmount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Status</span><span className={result.status === 'Fully Paid' ? 'text-success' : 'text-warning'}>{result.status}</span></div>
              <div className="flex justify-between"><span className="text-white/50">Issued</span><span>{new Date(result.issuedDate).toLocaleDateString()}</span></div>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center mx-auto mb-4">
              <ShieldX size={28} className="text-danger" />
            </div>
            <h1 className="text-xl font-display text-white mb-1">Not Verified</h1>
            <p className="text-white/60 text-sm">No invoice matches this reference. This document could not be verified as authentic.</p>
          </>
        )}
      </div>
    </div>
  );
}
