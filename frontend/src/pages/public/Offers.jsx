import { Link } from 'react-router-dom';
import { Tag, ArrowRight } from 'lucide-react';

const OFFERS = [
  { title: 'Weekend Escape', discount: '20% OFF', desc: 'Book Friday–Sunday and save on any room category.', code: 'WEEKEND20' },
  { title: 'Early Bird Special', discount: '15% OFF', desc: 'Reserve 30 days in advance for guaranteed savings.', code: 'EARLY15' },
  { title: 'Extended Stay', discount: '25% OFF', desc: 'Stay 5 nights or more and unlock our best rate.', code: 'STAY25' },
  { title: 'Honeymoon Package', discount: 'Free Upgrade', desc: 'Complimentary suite upgrade plus a bottle of champagne.', code: 'HONEYMOON' },
];

export default function Offers() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="font-display text-4xl mb-3">Special Offers</h1>
        <p className="text-text-secondary">Save more on your next stay with these limited-time deals</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {OFFERS.map((o, i) => (
          <div key={o.title} style={{ animationDelay: `${i * 80}ms` }} className="p-6 rounded-2xl bg-gradient-to-br from-navy to-deepNavy text-white relative overflow-hidden animate-slide-up">
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-gold/10" />
            <Tag className="text-gold mb-3" size={22} />
            <h3 className="font-display text-xl mb-1">{o.title}</h3>
            <p className="text-gold text-2xl font-bold mb-2">{o.discount}</p>
            <p className="text-white/70 text-sm mb-4">{o.desc}</p>
            <p className="text-xs text-white/50 mb-4">Promo code: <span className="font-mono text-gold">{o.code}</span></p>
            <Link to="/booking" className="inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:underline">
              Book Now <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
