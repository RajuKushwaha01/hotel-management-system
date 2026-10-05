import { Link } from 'react-router-dom';
import { PartyPopper, Users, Calendar } from 'lucide-react';

const EVENT_TYPES = [
  { name: 'Weddings', desc: 'Elegant banquet halls and full-service planning for your big day.', capacity: 'Up to 300 guests' },
  { name: 'Corporate Events', desc: 'Conference rooms equipped with AV, high-speed Wi-Fi, and catering.', capacity: 'Up to 150 guests' },
  { name: 'Private Parties', desc: 'Birthdays, anniversaries, and celebrations tailored to you.', capacity: 'Up to 100 guests' },
];

export default function EventsPublic() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="text-center mb-12 animate-fade-in">
        <PartyPopper className="mx-auto text-gold mb-3" size={32} />
        <h1 className="font-display text-4xl mb-3">Events & Banquets</h1>
        <p className="text-text-secondary">From intimate gatherings to grand celebrations, we handle every detail</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {EVENT_TYPES.map((e, i) => (
          <div key={e.name} style={{ animationDelay: `${i * 80}ms` }} className="p-6 rounded-2xl bg-white dark:bg-darkCard border border-border dark:border-darkBorder animate-slide-up">
            <h3 className="font-display text-lg mb-2">{e.name}</h3>
            <p className="text-text-secondary text-sm mb-3">{e.desc}</p>
            <p className="text-xs text-gold flex items-center gap-1"><Users size={12} /> {e.capacity}</p>
          </div>
        ))}
      </div>

      <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-navy to-deepNavy text-white">
        <Calendar className="mx-auto text-gold mb-3" size={26} />
        <h3 className="font-display text-xl mb-2">Planning an event?</h3>
        <p className="text-white/70 text-sm mb-5">Contact our events team for a custom quote and hall availability.</p>
        <Link to="/contact" className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold to-goldLight text-navy font-semibold">Get in Touch</Link>
      </div>
    </div>
  );
}
