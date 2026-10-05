import { useEffect, useState } from 'react';
import { BedDouble } from 'lucide-react';
import { roomManagementService } from '../../services/roomManagementService';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';

const ROOM_TYPES = ['single', 'double', 'twin', 'deluxe', 'suite', 'family', 'executive', 'presidential'];

export default function RoomTypes() {
  const [counts, setCounts] = useState(null);
  const [byType, setByType] = useState({});

  useEffect(() => {
    roomManagementService.getOverview().then((res) => setCounts(res.data.data));
    roomManagementService.getAll({ limit: 500 }).then((res) => {
      const grouped = {};
      res.data.data.forEach((r) => { (grouped[r.roomType] = grouped[r.roomType] || []).push(r); });
      setByType(grouped);
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">Room Types</h1>
      <p className="text-text-secondary text-sm mb-6">Overview of every room category and its inventory</p>

      {!counts ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROOM_TYPES.map((type) => {
            const rooms = byType[type] || [];
            const avgPrice = rooms.length ? Math.round(rooms.reduce((s, r) => s + r.pricePerNight, 0) / rooms.length) : 0;
            return (
              <Card key={type} hover>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-goldLight flex items-center justify-center mb-3">
                  <BedDouble size={18} className="text-navy" />
                </div>
                <h3 className="font-medium capitalize mb-1">{type}</h3>
                <p className="text-2xl font-display">{counts.byType[type] || 0}</p>
                <p className="text-xs text-text-secondary">room(s)</p>
                {avgPrice > 0 && <p className="text-xs text-gold mt-2">avg ₹{avgPrice}/night</p>}
              </Card>
            );
          })}
        </div>
      )}
      <p className="text-xs text-text-secondary mt-6">To edit individual rooms, prices, or amenities, use <span className="font-medium">Rooms</span> and <span className="font-medium">Room Rates</span> in the sidebar.</p>
    </div>
  );
}
