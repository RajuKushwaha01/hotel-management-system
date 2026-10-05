import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Check, Calendar, BedDouble } from 'lucide-react';
import { customerService } from '../../services/customerService';

export default function BookingConfirmation() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    customerService.getMyBookings().then((res) => {
      const found = res.data.data.find((b) => b._id === bookingId);
      setBooking(found || null);
    });
  }, [bookingId]);

  if (!booking) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
        <Check size={28} className="text-success" />
      </div>
      <h1 className="font-display text-3xl mb-2">Booking Confirmed!</h1>
      <p className="text-text-secondary mb-8">A confirmation email is on its way to you.</p>

      <div className="text-left p-6 rounded-2xl bg-white dark:bg-darkCard border border-border dark:border-darkBorder space-y-3 mb-8">
        <div className="flex items-center gap-3">
          <BedDouble size={18} className="text-gold" />
          <span>{booking.room?.roomType} — Room {booking.room?.roomNumber}</span>
        </div>
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-gold" />
          <span>{new Date(booking.checkIn).toLocaleDateString()} → {new Date(booking.checkOut).toLocaleDateString()}</span>
        </div>
        <div className="flex justify-between pt-3 border-t border-border dark:border-darkBorder font-semibold text-lg">
          <span>Total</span><span>₹{booking.totalAmount.toLocaleString()}</span>
        </div>
        <p className="text-xs text-text-secondary">Booking ID: {booking._id}</p>
      </div>

      <div className="flex gap-3 justify-center">
        <Link to="/customer/bookings" className="px-5 py-2.5 rounded-xl border border-border dark:border-darkBorder text-sm font-medium">View My Bookings</Link>
        <button onClick={() => navigate(`/payment/${bookingId}`)} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold to-goldLight text-navy text-sm font-semibold">Pay Now</button>
      </div>
    </div>
  );
}
