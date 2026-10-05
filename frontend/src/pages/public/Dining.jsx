import { Link } from 'react-router-dom';
import { UtensilsCrossed, Clock, Star } from 'lucide-react';

const VENUES = [
  { name: 'The Grand Table', type: 'Multi-Cuisine Restaurant', hours: '7 AM – 11 PM', desc: 'Our flagship restaurant serving global favorites with a focus on fresh, local ingredients.', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=700&q=80' },
  { name: 'Sky Lounge Bar', type: 'Rooftop Bar', hours: '5 PM – 1 AM', desc: 'Craft cocktails and small plates with panoramic city views.', img: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=700&q=80' },
  { name: 'In-Room Dining', type: 'Room Service', hours: '24 hours', desc: 'Full menu delivered straight to your room, any time of day.', img: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?w=700&q=80' },
];

export default function Dining() {
  return (
    <div>
      <div className="relative h-[46vh] flex items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80"
          alt="Fine dining"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-navy/20" />
        <div className="relative text-center px-4 animate-fade-in">
          <p className="text-gold tracking-[0.3em] text-xs uppercase mb-3">Culinary Experiences</p>
          <h1 className="font-display text-4xl md:text-5xl text-white">Dining at GrandVista</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <p className="text-center text-text-secondary mb-12 max-w-xl mx-auto">Three distinct experiences, one exceptional standard — from a sunrise breakfast to a rooftop nightcap.</p>

        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {VENUES.map((v, i) => (
            <div key={v.name} style={{ animationDelay: `${i * 80}ms` }} className="rounded-2xl overflow-hidden bg-white dark:bg-darkCard border border-border dark:border-darkBorder animate-slide-up hover:shadow-xl transition-shadow duration-300 group">
              <div className="h-48 overflow-hidden">
                <img src={v.img} alt={v.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="p-5">
                <p className="text-gold text-xs uppercase tracking-wide mb-1">{v.type}</p>
                <h3 className="font-display text-lg mb-2">{v.name}</h3>
                <p className="text-text-secondary text-sm mb-3">{v.desc}</p>
                <p className="text-xs flex items-center gap-1 text-text-secondary"><Clock size={12} /> {v.hours}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/menu" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gold to-goldLight text-navy font-semibold hover:shadow-lg transition">
            <Star size={16} /> View Full Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
