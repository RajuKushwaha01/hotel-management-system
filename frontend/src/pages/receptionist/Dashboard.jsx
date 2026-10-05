import { useEffect, useState } from 'react';
import { LogIn, LogOut, Users, DoorOpen, DoorClosed, Sparkles, AlertCircle } from 'lucide-react';
import { receptionistService } from '../../services/receptionistService';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function ReceptionistDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    receptionistService
      .getDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  const cards = [
    { label: 'Arrivals Today', value: data.arrivalsToday.length, icon: LogIn, color: 'green' },
    { label: 'Departures Today', value: data.departuresToday.length, icon: LogOut, color: 'purple' },
    { label: 'Expected Guests', value: data.expectedGuests, icon: Users, color: 'blue' },
    { label: 'Available Rooms', value: data.availableRooms, icon: DoorOpen, color: 'green' },
    { label: 'Occupied Rooms', value: data.occupiedRooms, icon: DoorClosed, color: 'gold' },
    { label: 'Dirty Rooms', value: data.dirtyRooms, icon: Sparkles, color: 'purple' },
    { label: 'Pending Payments', value: data.pendingPayments, icon: AlertCircle, color: 'gold' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">Front Desk</h1>
      <p className="text-text-secondary text-sm mb-6">Today's arrivals, departures and room status</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-4">Arriving Today</h3>
          {data.arrivalsToday.length === 0 ? <EmptyState title="No arrivals" /> : (
            <div className="space-y-3">
              {data.arrivalsToday.map((b) => (
                <div key={b._id} className="flex justify-between text-sm border-b border-border dark:border-darkBorder pb-2 last:border-0">
                  <span>{b.guest?.firstName} {b.guest?.lastName}</span>
                  <span className="text-text-secondary">Room {b.room?.roomNumber}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <h3 className="font-semibold mb-4">Departing Today</h3>
          {data.departuresToday.length === 0 ? <EmptyState title="No departures" /> : (
            <div className="space-y-3">
              {data.departuresToday.map((b) => (
                <div key={b._id} className="flex justify-between text-sm border-b border-border dark:border-darkBorder pb-2 last:border-0">
                  <span>{b.guest?.firstName} {b.guest?.lastName}</span>
                  <span className="text-text-secondary">Room {b.room?.roomNumber}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
