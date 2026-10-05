import { useEffect, useState } from 'react';
import { Calendar, Gift, Wallet, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { customerService } from '../../services/customerService';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';

export default function CustomerDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    customerService.getDashboard().then((res) => setData(res.data.data)).catch(() => toast.error('Failed to load dashboard'));
  }, []);

  if (!data) return null;

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">Welcome Back</h1>
      <p className="text-text-secondary text-sm mb-6">Here's what's happening with your stays</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Past Stays" value={data.pastBookingsCount} icon={History} color="blue" />
        <StatCard label="Total Spent" value={`₹${data.totalSpent.toLocaleString()}`} icon={Wallet} color="gold" />
        <StatCard label="Loyalty Points" value={data.loyaltyPoints} icon={Gift} color="purple" />
        <StatCard label="Membership" value={data.membershipLevel} icon={Gift} color="green" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Calendar size={18} /> Upcoming Stay</h3>
          {data.upcomingStay ? (
            <div>
              <p className="font-medium">Room {data.upcomingStay.room?.roomNumber} — {data.upcomingStay.room?.roomType}</p>
              <p className="text-text-secondary text-sm mt-1">
                {new Date(data.upcomingStay.checkIn).toLocaleDateString()} → {new Date(data.upcomingStay.checkOut).toLocaleDateString()}
              </p>
            </div>
          ) : <EmptyState title="No upcoming stays" message="Book your next getaway!" />}
        </Card>

        <Card>
          <h3 className="font-semibold mb-4">Current Stay</h3>
          {data.currentStay ? (
            <div>
              <p className="font-medium">Room {data.currentStay.room?.roomNumber}</p>
              <p className="text-text-secondary text-sm mt-1">Checked in — enjoy your stay!</p>
            </div>
          ) : <EmptyState title="Not currently checked in" />}
        </Card>
      </div>
    </div>
  );
}
