import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, BedDouble, Ruler } from 'lucide-react';
import { publicService } from '../../services/publicService';
import Skeleton from '../../components/ui/Skeleton';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('');

  useEffect(() => {
    setLoading(true);
    publicService.getRooms({ sort }).then((res) => setRooms(res.data.data)).finally(() => setLoading(false));
  }, [sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl mb-1">Our Rooms</h1>
          <p className="text-text-secondary text-sm">Find the perfect space for your stay</p>
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-4 py-2 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkCard text-sm">
          <option value="">Sort by</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80" />)}</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {rooms.map((room, i) => (
            <div
              key={room._id}
              style={{ animationDelay: `${(i % 6) * 60}ms` }}
              className="rounded-2xl overflow-hidden bg-white dark:bg-darkCard border border-border dark:border-darkBorder hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 animate-slide-up group"
            >
              <div className="h-52 overflow-hidden relative">
                {room.images?.[0] ? (
                  <img
                    src={room.images[0]}
                    alt={`${room.roomType} room`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-navy to-deepNavy flex items-center justify-center">
                    <BedDouble className="text-white/20" size={40} />
                  </div>
                )}
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 dark:bg-navy/90 text-[11px] font-semibold capitalize backdrop-blur-sm">
                  {room.roomType}
                </span>
              </div>

              <div className="p-5">
                <h3 className="font-display text-lg mb-2">{room.roomType} — {room.roomNumber}</h3>
                <div className="flex gap-4 text-text-secondary text-sm mb-4">
                  <span className="flex items-center gap-1"><Users size={14} /> {room.maxGuests || room.capacity}</span>
                  <span className="flex items-center gap-1"><BedDouble size={14} /> {room.bedType}</span>
                  <span className="flex items-center gap-1"><Ruler size={14} /> {room.sizeSqm}m²</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gold text-lg">₹{room.pricePerNight.toLocaleString()}<span className="text-xs font-normal text-text-secondary">/night</span></span>
                  <Link to={`/rooms/${room._id}`} className="px-4 py-2 rounded-lg bg-navy dark:bg-gold text-white dark:text-navy text-sm font-medium hover:bg-deepNavy dark:hover:bg-goldLight transition">View</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
