import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, PhoneCall, UtensilsCrossed, Waves, Wifi, Dumbbell, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { qrService } from '../../services/qrService';

const ICONS = { 'Swimming Pool': Waves, 'Restaurant': UtensilsCrossed, 'Fitness Center': Dumbbell, 'Spa': Sparkles, 'Free Wi-Fi': Wifi };

export default function QRRoom() {
  const { roomNumber } = useParams();
  const [data, setData] = useState(null);
  const [showContact, setShowContact] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    qrService.getRoomInfo(roomNumber).then((res) => setData(res.data.data)).catch(() => toast.error('This room QR code is no longer valid'));
  }, [roomNumber]);

  const handleHousekeeping = async () => {
    try {
      const res = await qrService.requestHousekeeping(roomNumber);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await qrService.contactReception(roomNumber, message);
      toast.success('Message sent to the front desk');
      setShowContact(false);
      setMessage('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-deepNavy px-4 py-10">
      <div className="max-w-md mx-auto text-center mb-8 animate-fade-in">
        <p className="font-display text-2xl text-white">
          {data.guestFirstName ? `Welcome, ${data.guestFirstName}` : 'Welcome'}
        </p>
        <p className="text-gold text-sm mt-1">Room {data.room.roomNumber} · {data.room.roomType}</p>
      </div>

      <div className="max-w-md mx-auto grid grid-cols-2 gap-3 mb-8">
        <button
          onClick={handleHousekeeping}
          disabled={!data.hasActiveStay}
          className="p-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white flex flex-col items-center gap-2 hover:bg-white/15 transition disabled:opacity-40"
        >
          <Sparkles size={22} className="text-gold" />
          <span className="text-sm font-medium">Housekeeping</span>
        </button>
        <button
          onClick={() => setShowContact(true)}
          disabled={!data.hasActiveStay}
          className="p-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white flex flex-col items-center gap-2 hover:bg-white/15 transition disabled:opacity-40"
        >
          <PhoneCall size={22} className="text-gold" />
          <span className="text-sm font-medium">Contact Reception</span>
        </button>
        <Link
          to={data.hasActiveStay ? `/qr-room/${roomNumber}/room-service` : '#'}
          className="p-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white flex flex-col items-center gap-2 hover:bg-white/15 transition"
        >
          <UtensilsCrossed size={22} className="text-gold" />
          <span className="text-sm font-medium">Room Service</span>
        </Link>
        <div className="p-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white flex flex-col items-center gap-2">
          <MessageSquare size={22} className="text-gold" />
          <span className="text-sm font-medium">Dial 0 for Front Desk</span>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <h3 className="text-white/80 text-sm font-medium mb-3 px-1">Hotel Facilities</h3>
        <div className="space-y-2">
          {data.facilities.map((f) => {
            const Icon = ICONS[f.name] || Sparkles;
            return (
              <div key={f.name} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 text-white/90">
                <Icon size={18} className="text-gold shrink-0" />
                <div>
                  <p className="text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-white/50">{f.hours}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showContact && (
        <div className="fixed inset-0 z-30 flex items-end sm:items-center sm:justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowContact(false)} />
          <form onSubmit={handleContactSubmit} className="relative w-full sm:max-w-sm bg-white dark:bg-darkCard rounded-t-3xl sm:rounded-2xl p-6 animate-slide-up">
            <h3 className="font-display text-lg mb-3">Message the Front Desk</h3>
            <textarea
              value={message} onChange={(e) => setMessage(e.target.value)} required rows={3}
              placeholder="How can we help?"
              className="w-full px-4 py-3 rounded-xl border border-border dark:border-darkBorder bg-transparent resize-none"
            />
            <button disabled={sending} className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-gold to-goldLight text-navy font-semibold">
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
