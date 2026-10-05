import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, BedDouble, Ruler, Star, Check } from 'lucide-react';
import { publicService } from '../../services/publicService';

export default function RoomDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    publicService.getRoomDetails(id).then((res) => setData(res.data.data));
  }, [id]);

  if (!data) return <div className="max-w-5xl mx-auto px-4 py-20 text-center">Loading...</div>;

  const { room, similarRooms, reviews } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="h-96 rounded-2xl mb-8 overflow-hidden">
          {room.images?.[0] ? (
    <img src={room.images[0]} alt={room.roomType} className="w-full h-full object-cover" />
        ) : (
    <div className="w-full h-full bg-gradient-to-br from-navy to-deepNavy" />
     )}
     </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <h1 className="font-display text-3xl mb-2">{room.roomType} — Room {room.roomNumber}</h1>
          <div className="flex gap-6 text-text-secondary mb-6">
            <span className="flex items-center gap-1"><Users size={16} /> {room.maxGuests} Guests</span>
            <span className="flex items-center gap-1"><BedDouble size={16} /> {room.bedType} Bed</span>
            <span className="flex items-center gap-1"><Ruler size={16} /> {room.sizeSqm} m²</span>
          </div>
          <p className="text-text-secondary mb-6">{room.description}</p>

          <h3 className="font-semibold mb-3">Amenities</h3>
          <div className="grid grid-cols-2 gap-2 mb-8">
            {(room.amenities || []).map((a) => (
              <span key={a} className="flex items-center gap-2 text-sm"><Check size={14} className="text-success" /> {a}</span>
            ))}
          </div>

          {reviews.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Guest Reviews</h3>
              <div className="space-y-4">
                {reviews.slice(0, 3).map((r) => (
                  <div key={r._id} className="p-4 rounded-xl bg-bgLight dark:bg-darkBg">
                    <div className="flex items-center gap-1 text-gold mb-1">{[...Array(r.rating)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}</div>
                    <p className="text-sm">{r.comment}</p>
                    <p className="text-xs text-text-secondary mt-1">{r.guest?.firstName} {r.guest?.lastName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="sticky top-24 p-6 rounded-2xl bg-white dark:bg-darkCard border border-border dark:border-darkBorder shadow-lg">
            <p className="text-3xl font-bold text-gold mb-1">₹{room.pricePerNight}</p>
            <p className="text-text-secondary text-sm mb-6">per night</p>
            <Link to={`/booking?roomId=${room._id}`} className="block text-center px-6 py-3 rounded-xl bg-gradient-to-r from-gold to-goldLight text-navy font-semibold hover:shadow-lg transition">
              Book This Room
            </Link>
          </div>

          {similarRooms.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-3 text-sm">Similar Rooms</h4>
              {similarRooms.map((r) => (
                <Link key={r._id} to={`/rooms/${r._id}`} className="block p-3 rounded-xl bg-bgLight dark:bg-darkBg mb-2 hover:bg-black/5 dark:hover:bg-white/5 transition text-sm">
                  Room {r.roomNumber} — ₹{r.pricePerNight}/night
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
