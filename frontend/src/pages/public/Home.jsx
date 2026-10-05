import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Wifi, Waves, Dumbbell, Car, UtensilsCrossed } from 'lucide-react';
import { publicService } from '../../services/publicService';

const FACILITIES = [
  { icon: Waves, label: 'Swimming Pool' },
  { icon: UtensilsCrossed, label: 'Restaurant' },
  { icon: Dumbbell, label: 'Fitness Center' },
  { icon: Car, label: 'Parking' },
  { icon: Wifi, label: 'Free Wi-Fi' },
];

export default function Home() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    publicService.getRooms().then((res) => setRooms(res.data.data.slice(0, 3)));
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative h-[80vh] flex items-center justify-center bg-gradient-to-br from-navy via-deepNavy to-black overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(201,162,39,0.15),transparent_50%)]" />
        <div className="relative text-center px-4 animate-fade-in">
          <p className="text-gold tracking-[0.3em] text-sm mb-4 uppercase">Welcome to</p>
          <h1 className="font-display text-5xl md:text-7xl text-white mb-6">
            Grand<span className="text-gold">Vista</span> Hotel
          </h1>
          <p className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
            Experience luxury and comfort — your perfect stay begins here.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/rooms" className="px-8 py-3.5 rounded-xl border border-white/30 text-white hover:bg-white/10 transition">
              Explore Rooms
            </Link>
            <Link to="/booking" className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-gold to-goldLight text-navy font-semibold hover:shadow-xl hover:shadow-gold/30 transition">
              Book Now
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 bg-white dark:bg-darkCard">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center px-4">
          {[['500+', 'Happy Guests'], ['120+', 'Luxury Rooms'], ['15+', 'Years Experience'], ['25+', 'Awards']].map(([n, l]) => (
            <div key={l} className="animate-slide-up">
              <p className="text-4xl font-display text-gold">{n}</p>
              <p className="text-text-secondary text-sm mt-1">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED ROOMS */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="font-display text-3xl text-center mb-2">Featured Rooms</h2>
        <p className="text-text-secondary text-center mb-12">Handpicked accommodations for every taste</p>
        <div className="grid md:grid-cols-3 gap-8">
          {rooms.map((room) => (
            <div key={room._id} className="rounded-2xl overflow-hidden bg-white dark:bg-darkCard border border-border dark:border-darkBorder hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="h-56 overflow-hidden">
                  {room.images?.[0] ? (
                    <img src={room.images[0]} alt={room.roomType} className="w-full h-full object-cover" />
                      ) : (
                    <div className="w-full h-full bg-gradient-to-br from-navy to-deepNavy" />
                  )}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-1 text-gold mb-2">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <h3 className="font-display text-lg mb-1">{room.roomType}</h3>
                <p className="text-text-secondary text-sm mb-4">{room.maxGuests} Guests · {room.bedType} Bed · {room.sizeSqm} m²</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gold text-lg">₹{room.pricePerNight}<span className="text-xs text-text-secondary">/night</span></span>
                  <Link to={`/rooms/${room._id}`} className="text-sm font-medium hover:text-gold transition">View Details →</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FACILITIES */}
      <section className="py-20 bg-bgLight dark:bg-darkBg">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="font-display text-3xl text-center mb-12">Hotel Facilities</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {FACILITIES.map(({ icon: Icon, label }) => (
              <div key={label} className="text-center p-6 rounded-2xl bg-white dark:bg-darkCard hover:shadow-lg transition-all duration-300">
                <Icon className="mx-auto text-gold mb-3" size={28} />
                <p className="text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
