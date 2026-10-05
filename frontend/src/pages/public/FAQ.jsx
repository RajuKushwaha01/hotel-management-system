import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  { q: 'What time is check-in and check-out?', a: 'Check-in is from 2:00 PM and check-out is by 11:00 AM. Early check-in and late check-out are available on request, subject to availability.' },
  { q: 'Is breakfast included in my booking?', a: 'This depends on the rate plan selected during booking. You can check your invoice or contact reception to confirm.' },
  { q: 'Can I cancel or modify my booking?', a: 'Yes, bookings can be modified or cancelled free of charge up to 24 hours before check-in from your dashboard.' },
  { q: 'Do you offer airport transfers?', a: 'Yes, airport pickup and drop can be arranged through the Transport section of your guest dashboard or by contacting reception.' },
  { q: 'Is Wi-Fi available throughout the hotel?', a: 'Yes, complimentary high-speed Wi-Fi is available in all rooms and public areas.' },
  { q: 'Are pets allowed?', a: 'We currently do not accommodate pets, with the exception of registered service animals.' },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-10 animate-fade-in">
        <h1 className="font-display text-4xl mb-3">Frequently Asked Questions</h1>
        <p className="text-text-secondary">Everything you need to know before your stay</p>
      </div>

      <div className="space-y-3">
        {FAQS.map((f, i) => (
          <div key={f.q} className="rounded-2xl bg-white dark:bg-darkCard border border-border dark:border-darkBorder overflow-hidden">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between px-5 py-4 text-left">
              <span className="font-medium">{f.q}</span>
              <ChevronDown size={18} className={`shrink-0 transition-transform ${open === i ? 'rotate-180 text-gold' : 'text-text-secondary'}`} />
            </button>
            {open === i && <p className="px-5 pb-4 text-text-secondary text-sm animate-fade-in">{f.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
