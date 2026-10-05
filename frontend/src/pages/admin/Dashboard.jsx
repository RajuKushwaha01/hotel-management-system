import { useEffect, useState } from 'react';
import {
  Users, BedDouble, DoorOpen, Wrench, LogIn, LogOut,
  CalendarCheck, IndianRupee, TrendingUp, AlertCircle,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import StatCard from '../../components/ui/StatCard';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService
      .getDashboard()
      .then((res) => setStats(res.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'gold' },
    { label: 'Active Users', value: stats.activeUsers, icon: Users, color: 'blue' },
    { label: 'Total Rooms', value: stats.totalRooms, icon: BedDouble, color: 'purple' },
    { label: 'Occupied Rooms', value: stats.occupiedRooms, icon: DoorOpen, color: 'blue' },
    { label: 'Available Rooms', value: stats.availableRooms, icon: DoorOpen, color: 'green' },
    { label: 'Maintenance Rooms', value: stats.maintenanceRooms, icon: Wrench, color: 'gold' },
    { label: "Today's Check-ins", value: stats.todayCheckIns, icon: LogIn, color: 'green' },
    { label: "Today's Check-outs", value: stats.todayCheckOuts, icon: LogOut, color: 'purple' },
    { label: "Today's Bookings", value: stats.todayBookings, icon: CalendarCheck, color: 'blue' },
    { label: "Today's Revenue", value: `₹${stats.todayRevenue.toLocaleString()}`, icon: IndianRupee, color: 'gold' },
    { label: 'Monthly Revenue', value: `₹${stats.monthlyRevenue.toLocaleString()}`, icon: TrendingUp, color: 'green' },
    { label: 'Pending Payments', value: stats.pendingPayments, icon: AlertCircle, color: 'purple' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">System Overview</h1>
      <p className="text-text-secondary text-sm mb-6">Real-time snapshot across the entire property</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>
    </div>
  );
}
