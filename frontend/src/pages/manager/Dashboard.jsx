import { useEffect, useState } from 'react';
import { LogIn, LogOut, BedDouble, Wrench, AlertCircle, CalendarCheck, IndianRupee, TrendingUp } from 'lucide-react';
import { managerService } from '../../services/managerService';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Skeleton from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    managerService
      .getDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }

  const cards = [
    { label: "Arrivals Today", value: data.arrivalsToday, icon: LogIn, color: 'green' },
    { label: "Departures Today", value: data.departuresToday, icon: LogOut, color: 'purple' },
    { label: "Occupancy Rate", value: `${data.occupancyRate}%`, icon: BedDouble, color: 'gold' },
    { label: "Available Rooms", value: data.availableRooms, icon: BedDouble, color: 'blue' },
    { label: "Maintenance Rooms", value: data.maintenanceRooms, icon: Wrench, color: 'purple' },
    { label: "Pending Payments", value: data.pendingPayments, icon: AlertCircle, color: 'gold' },
    { label: "Today's Bookings", value: data.totalBookingsToday, icon: CalendarCheck, color: 'blue' },
    { label: "Today's Revenue", value: `₹${data.todayRevenue.toLocaleString()}`, icon: IndianRupee, color: 'green' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">Hotel Operations</h1>
      <p className="text-text-secondary text-sm mb-6">Live status across arrivals, rooms and revenue</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-4">Today's Arrivals</h3>
          {data.arrivals.length === 0 ? (
            <EmptyState title="No arrivals today" />
          ) : (
            <div className="space-y-3">
              {data.arrivals.map((b) => (
                <div key={b._id} className="flex justify-between items-center text-sm border-b border-border dark:border-darkBorder pb-2 last:border-0">
                  <span>{b.guest?.firstName} {b.guest?.lastName}</span>
                  <span className="text-text-secondary">Room {b.room?.roomNumber}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Today's Departures</h3>
          {data.departures.length === 0 ? (
            <EmptyState title="No departures today" />
          ) : (
            <div className="space-y-3">
              {data.departures.map((b) => (
                <div key={b._id} className="flex justify-between items-center text-sm border-b border-border dark:border-darkBorder pb-2 last:border-0">
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
