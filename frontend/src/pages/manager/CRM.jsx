import { useEffect, useState } from 'react';
import { Users, MessageSquareWarning, Star, Cake } from 'lucide-react';
import toast from 'react-hot-toast';
import { crmService } from '../../services/crmService';
import StatCard from '../../components/ui/StatCard';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Tabs from '../../components/ui/Tabs';
import StatusBadge from '../../components/ui/StatusBadge';

export default function CRM() {
  const [dashboard, setDashboard] = useState(null);
  const [frequent, setFrequent] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [profile, setProfile] = useState(null);

  const load = () => {
    crmService.getDashboard().then((res) => setDashboard(res.data.data));
    crmService.getFrequentGuests().then((res) => setFrequent(res.data.data));
    crmService.getOccasions().then((res) => setOccasions(res.data.data));
  };
  useEffect(() => { load(); }, []);

  const viewProfile = async (guestId) => {
    try {
      const res = await crmService.getGuestProfile(guestId);
      setProfile(res.data.data);
    } catch { toast.error('Failed to load guest profile'); }
  };

  const frequentColumns = [
    { key: 'name', label: 'Guest', render: (r) => `${r.guest.firstName} ${r.guest.lastName}` },
    { key: 'email', label: 'Email', render: (r) => r.guest.email },
    { key: 'completedStays', label: 'Completed Stays' },
    { key: 'membershipLevel', label: 'Tier', render: (r) => <StatusBadge status={r.guest.membershipLevel?.toLowerCase() || 'bronze'} /> },
    { key: 'actions', label: '', render: (r) => <button onClick={() => viewProfile(r.guest._id)} className="text-sm font-medium text-gold hover:underline">View Profile</button> },
  ];

  const occasionColumns = [
    { key: 'name', label: 'Guest', render: (r) => `${r.guest.firstName} ${r.guest.lastName}` },
    { key: 'occasion', label: 'Occasion' },
    { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
    { key: 'contact', label: 'Contact', render: (r) => r.guest.phone },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">CRM / Customer Management</h1>
      <p className="text-text-secondary text-sm mb-6">Guest history, frequent guests, and upcoming occasions</p>

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Guests" value={dashboard.totalGuests} icon={Users} color="blue" />
          <StatCard label="Open Complaints" value={dashboard.openComplaints} icon={MessageSquareWarning} color="gold" />
          <StatCard label="Avg. Rating" value={`${dashboard.avgRating} ★`} icon={Star} color="green" />
          <StatCard label="Total Reviews" value={dashboard.totalReviews} icon={Star} color="purple" />
        </div>
      )}

      <Tabs
        tabs={[
          { id: 'frequent', label: 'Frequent Guests', content: <Table columns={frequentColumns} data={frequent} emptyMessage="No frequent guests yet (3+ completed stays)" /> },
          { id: 'occasions', label: 'Upcoming Birthdays', content: <Table columns={occasionColumns} data={occasions} emptyMessage="No upcoming occasions in the next 30 days" /> },
        ]}
      />

      <Modal open={!!profile} onClose={() => setProfile(null)} title={`${profile?.guest?.firstName} ${profile?.guest?.lastName}`} size="lg">
        {profile && (
          <div>
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="text-center p-3 rounded-xl bg-bgLight dark:bg-darkBg"><p className="text-xl font-bold">{profile.summary.totalBookings}</p><p className="text-xs text-text-secondary">Bookings</p></div>
              <div className="text-center p-3 rounded-xl bg-bgLight dark:bg-darkBg"><p className="text-xl font-bold">₹{profile.summary.totalSpent.toLocaleString()}</p><p className="text-xs text-text-secondary">Spent</p></div>
              <div className="text-center p-3 rounded-xl bg-bgLight dark:bg-darkBg"><p className="text-xl font-bold">{profile.summary.avgRating || '—'}</p><p className="text-xs text-text-secondary">Avg Rating</p></div>
              <div className="text-center p-3 rounded-xl bg-bgLight dark:bg-darkBg"><p className="text-xl font-bold">{profile.guest.loyaltyPoints}</p><p className="text-xs text-text-secondary">Loyalty Pts</p></div>
            </div>

            {profile.guest.preferences && (
              <div className="mb-4 p-3 rounded-xl bg-gold/5 border border-gold/20">
                <p className="text-xs text-text-secondary mb-1">Preferences</p>
                <p className="text-sm">{profile.guest.preferences}</p>
              </div>
            )}

            <Tabs
              tabs={[
                {
                  id: 'bookings', label: 'Bookings',
                  content: (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {profile.bookings.map((b) => (
                        <div key={b._id} className="flex justify-between text-sm border-b border-border dark:border-darkBorder pb-2">
                          <span>Room {b.room?.roomNumber} · {new Date(b.checkIn).toLocaleDateString()}</span>
                          <StatusBadge status={b.status} />
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  id: 'reviews', label: 'Reviews',
                  content: (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {profile.reviews.length === 0 ? <p className="text-text-secondary text-sm">No reviews</p> : profile.reviews.map((r) => (
                        <div key={r._id} className="text-sm border-b border-border dark:border-darkBorder pb-2">
                          <div className="flex items-center gap-1 text-gold mb-1">{'★'.repeat(r.rating)}</div>
                          <p>{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  id: 'complaints', label: 'Complaints',
                  content: (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {profile.complaints.length === 0 ? <p className="text-text-secondary text-sm">No complaints</p> : profile.complaints.map((c) => (
                        <div key={c._id} className="flex justify-between text-sm border-b border-border dark:border-darkBorder pb-2">
                          <span>{c.subject}</span>
                          <StatusBadge status={c.status === 'resolved' || c.status === 'closed' ? 'completed' : 'pending'} />
                        </div>
                      ))}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
