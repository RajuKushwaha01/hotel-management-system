const SECTIONS = [
  { title: 'Cancellation Policy', body: 'Free cancellation up to 24 hours before check-in. Cancellations made within 24 hours of check-in, or no-shows, are charged one night\'s stay.' },
  { title: 'Check-in / Check-out', body: 'Check-in begins at 2:00 PM; check-out is by 11:00 AM. Requests for early check-in or late check-out are accommodated where possible, subject to availability and may incur a fee.' },
  { title: 'Payment', body: 'We accept cash, all major credit/debit cards, and UPI. A valid photo ID and payment method are required at check-in.' },
  { title: 'Privacy Policy', body: 'Guest information is used solely to manage your booking and stay, and is never sold to third parties. Identity documents are stored securely and access is restricted and logged.' },
  { title: 'House Rules', body: 'Smoking is permitted only in designated areas. Quiet hours are from 10 PM to 7 AM. Visitors must be registered at the front desk after 9 PM.' },
];

export default function Policies() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="text-center mb-10 animate-fade-in">
        <h1 className="font-display text-4xl mb-3">Policies</h1>
        <p className="text-text-secondary">Please review before your stay</p>
      </div>

      <div className="space-y-8">
        {SECTIONS.map((s) => (
          <div key={s.title}>
            <h3 className="font-display text-lg mb-2 text-gold">{s.title}</h3>
            <p className="text-text-secondary text-sm leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
