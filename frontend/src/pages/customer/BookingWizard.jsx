import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { customerService } from '../../services/customerService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const STEPS = ['Dates', 'Room', 'Review', 'Confirmed'];

export default function BookingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ checkIn: '', checkOut: '', guests: 1 });
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [specialRequests, setSpecialRequests] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const nights = form.checkIn && form.checkOut
    ? Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / (1000 * 60 * 60 * 24))
    : 0;

  const searchRooms = async () => {
    if (!form.checkIn || !form.checkOut) return toast.error('Select both dates');
    try {
      const res = await customerService.checkAvailability(form);
      setRooms(res.data.data);
      setStep(1);
      if (res.data.data.length === 0) toast('No rooms available for these dates', { icon: '⚠️' });
    } catch {
      toast.error('Failed to check availability');
    }
  };

  const handleConfirm = async () => {
    try {
      const res = await customerService.createBooking({
        roomId: selectedRoom._id,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: form.guests,
        specialRequests,
      });
      setConfirmedBooking(res.data.data);
      toast.success('Booking confirmed!');
      navigate(`/booking-confirmation/${res.data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="flex justify-between mb-10">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 text-center">
            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium ${i <= step ? 'bg-gold text-navy' : 'bg-black/10 dark:bg-white/10 text-text-secondary'}`}>
              {i < step ? <Check size={14} /> : i + 1}
            </div>
            <p className="text-xs mt-1">{s}</p>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Check-in" type="date" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} />
            <Input label="Check-out" type="date" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} />
          </div>
          <Input label="Guests" type="number" min="1" value={form.guests} onChange={(e) => setForm({ ...form, guests: Number(e.target.value) })} />
          <Button variant="gold" className="w-full" onClick={searchRooms}>Search Rooms</Button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3 animate-fade-in">
          {rooms.map((r) => (
            <div
              key={r._id}
              onClick={() => setSelectedRoom(r)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition ${selectedRoom?._id === r._id ? 'border-gold bg-gold/5' : 'border-border dark:border-darkBorder'}`}
            >
              <div className="flex justify-between">
                <div><p className="font-medium">{r.roomType} — {r.roomNumber}</p><p className="text-sm text-text-secondary">{r.maxGuests} guests · {r.bedType}</p></div>
                <p className="font-bold text-gold">₹{r.pricePerNight}/night</p>
              </div>
            </div>
          ))}
          <Button variant="gold" className="w-full" disabled={!selectedRoom} onClick={() => setStep(2)}>Continue</Button>
        </div>
      )}

      {step === 2 && selectedRoom && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-xl bg-bgLight dark:bg-darkBg space-y-2 text-sm">
            <div className="flex justify-between"><span>Room</span><span>{selectedRoom.roomType} — {selectedRoom.roomNumber}</span></div>
            <div className="flex justify-between"><span>Dates</span><span>{form.checkIn} → {form.checkOut}</span></div>
            <div className="flex justify-between"><span>Nights</span><span>{nights}</span></div>
            <div className="flex justify-between font-bold pt-2 border-t border-border dark:border-darkBorder"><span>Total</span><span>₹{(nights * selectedRoom.pricePerNight).toLocaleString()}</span></div>
          </div>
          <Input placeholder="Special requests (optional)" value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} />
          <Button variant="gold" className="w-full" onClick={handleConfirm}>Confirm Booking</Button>
        </div>
      )}

      {step === 3 && confirmedBooking && (
        <div className="text-center py-10 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-success" />
          </div>
          <h2 className="text-2xl font-display mb-2">Booking Confirmed!</h2>
          <p className="text-text-secondary">Your reservation for Room {confirmedBooking.room?.roomNumber} is confirmed.</p>
        </div>
      )}
    </div>
  );
}
