import { Waves, UtensilsCrossed, Dumbbell, Sparkles, Car, Wifi, Bell, Shirt } from 'lucide-react';

const FACILITIES = [
  { icon: Waves, name: 'Swimming Pool', desc: 'Heated outdoor pool open year-round, with a dedicated kids\' area.', hours: '6 AM – 9 PM' },
  { icon: UtensilsCrossed, name: 'Restaurant', desc: 'Multi-cuisine dining with a rotating chef\'s special menu.', hours: '7 AM – 11 PM' },
  { icon: Dumbbell, name: 'Fitness Center', desc: 'Fully equipped gym with cardio, free weights, and a trainer on request.', hours: '24 hours' },
  { icon: Sparkles, name: 'Spa & Wellness', desc: 'Massage therapy, facials, and a steam room.', hours: '10 AM – 8 PM' },
  { icon: Car, name: 'Valet Parking', desc: 'Complimentary valet parking for all registered guests.', hours: '24 hours' },
  { icon: Wifi, name: 'Free Wi-Fi', desc: 'High-speed internet throughout the property, including outdoor areas.', hours: 'Always on' },
  { icon: Bell, name: 'Concierge', desc: 'Local recommendations, reservations, and travel arrangements.', hours: '7 AM – 11 PM' },
  { icon: Shirt, name: 'Laundry Service', desc: 'Same-day wash, dry-clean, and pressing services.', hours: '8 AM – 8 PM' },
];

export default function Facilities() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="font-display text-4xl mb-3">Hotel Facilities</h1>
        <p className="text-text-secondary">Everything you need for a comfortable, effortless stay</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {FACILITIES.map(({ icon: Icon, name, desc, hours }, i) => (
          <div
            key={name}
            style={{ animationDelay: `${i * 60}ms` }}
            className="p-6 rounded-2xl bg-white dark:bg-darkCard border border-border dark:border-darkBorder hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold to-goldLight flex items-center justify-center mb-4">
              <Icon size={20} className="text-navy" />
            </div>
            <h3 className="font-medium mb-1.5">{name}</h3>
            <p className="text-text-secondary text-sm mb-3">{desc}</p>
            <p className="text-xs text-gold font-medium">{hours}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
