import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { eventService } from '../../services/eventService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Tabs from '../../components/ui/Tabs';
import StatusBadge from '../../components/ui/StatusBadge';

const EVENT_TYPES = ['wedding', 'meeting', 'party', 'corporate_event', 'conference'];

export default function Events() {
  const [halls, setHalls] = useState([]);
  const [events, setEvents] = useState([]);
  const [showNewHall, setShowNewHall] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [advanceTarget, setAdvanceTarget] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [hallForm, setHallForm] = useState({ name: '', type: 'banquet_hall', capacity: '', pricePerHour: '', pricePerDay: '' });
  const [eventForm, setEventForm] = useState({
    hallId: '', eventType: 'wedding', eventName: '', clientName: '', clientPhone: '',
    eventDate: '', startTime: '', endTime: '', guestCount: '',
    cateringRequested: false, costPerPlate: '', decorationRequested: false, decorationCost: '',
  });

  const load = () => {
    eventService.getHalls().then((res) => setHalls(res.data.data));
    eventService.getAll().then((res) => setEvents(res.data.data));
  };
  useEffect(() => { load(); }, []);

  const handleCreateHall = async (e) => {
    e.preventDefault();
    try {
      await eventService.createHall({ ...hallForm, capacity: Number(hallForm.capacity), pricePerHour: Number(hallForm.pricePerHour), pricePerDay: Number(hallForm.pricePerDay) });
      toast.success('Hall added');
      setShowNewHall(false);
      setHallForm({ name: '', type: 'banquet_hall', capacity: '', pricePerHour: '', pricePerDay: '' });
      load();
    } catch { toast.error('Failed to add hall'); }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await eventService.create({
        hallId: eventForm.hallId, eventType: eventForm.eventType, eventName: eventForm.eventName,
        clientName: eventForm.clientName, clientPhone: eventForm.clientPhone, eventDate: eventForm.eventDate,
        startTime: eventForm.startTime, endTime: eventForm.endTime, guestCount: Number(eventForm.guestCount),
        catering: { requested: eventForm.cateringRequested, costPerPlate: Number(eventForm.costPerPlate) || 0 },
        decoration: { requested: eventForm.decorationRequested, cost: Number(eventForm.decorationCost) || 0 },
      });
      toast.success('Event booking created');
      setShowNewEvent(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create booking'); }
  };

  const handleAdvance = async (e) => {
    e.preventDefault();
    try {
      await eventService.collectAdvance(advanceTarget, Number(advanceAmount));
      toast.success('Advance recorded');
      setAdvanceTarget(null);
      setAdvanceAmount('');
      load();
    } catch { toast.error('Failed to record advance'); }
  };

  const eventColumns = [
    { key: 'eventName', label: 'Event' },
    { key: 'eventType', label: 'Type', render: (r) => <span className="capitalize">{r.eventType.replace(/_/g, ' ')}</span> },
    { key: 'hall', label: 'Hall', render: (r) => r.hall?.name },
    { key: 'eventDate', label: 'Date', render: (r) => new Date(r.eventDate).toLocaleDateString() },
    { key: 'totalCost', label: 'Total', render: (r) => `₹${r.totalCost.toLocaleString()}` },
    { key: 'advancePayment', label: 'Advance', render: (r) => `₹${r.advancePayment.toLocaleString()}` },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status === 'confirmed' ? 'confirmed' : r.status === 'completed' ? 'completed' : 'pending'} /> },
    { key: 'actions', label: '', render: (r) => <Button className="!px-3 !py-1.5 text-xs" onClick={() => setAdvanceTarget(r._id)}>Add Advance</Button> },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-6">Banquet & Event Management</h1>

      <Tabs
        tabs={[
          {
            id: 'halls', label: 'Halls',
            content: (
              <div>
                <Button variant="gold" className="mb-4 flex items-center gap-2" onClick={() => setShowNewHall(true)}><Plus size={16} /> Add Hall</Button>
                <div className="grid sm:grid-cols-2 gap-4">
                  {halls.map((h) => (
                    <div key={h._id} className="p-4 rounded-xl border border-border dark:border-darkBorder">
                      <h4 className="font-medium">{h.name}</h4>
                      <p className="text-sm text-text-secondary capitalize">{h.type.replace(/_/g, ' ')} · {h.capacity} capacity</p>
                      <p className="text-gold font-semibold mt-1">₹{h.pricePerDay}/day</p>
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          {
            id: 'events', label: 'Event Bookings',
            content: (
              <div>
                <Button variant="gold" className="mb-4 flex items-center gap-2" onClick={() => setShowNewEvent(true)}><Plus size={16} /> New Event Booking</Button>
                <Table columns={eventColumns} data={events} emptyMessage="No events booked" />
              </div>
            ),
          },
        ]}
      />

      <Modal open={showNewHall} onClose={() => setShowNewHall(false)} title="Add Hall">
        <form onSubmit={handleCreateHall} className="space-y-3">
          <Input placeholder="Hall name" value={hallForm.name} onChange={(e) => setHallForm({ ...hallForm, name: e.target.value })} required />
          <select value={hallForm.type} onChange={(e) => setHallForm({ ...hallForm, type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg">
            <option value="conference_room">Conference Room</option><option value="banquet_hall">Banquet Hall</option><option value="meeting_room">Meeting Room</option>
          </select>
          <Input placeholder="Capacity" type="number" value={hallForm.capacity} onChange={(e) => setHallForm({ ...hallForm, capacity: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Price/hour (₹)" type="number" value={hallForm.pricePerHour} onChange={(e) => setHallForm({ ...hallForm, pricePerHour: e.target.value })} required />
            <Input placeholder="Price/day (₹)" type="number" value={hallForm.pricePerDay} onChange={(e) => setHallForm({ ...hallForm, pricePerDay: e.target.value })} required />
          </div>
          <Button variant="gold" className="w-full">Add Hall</Button>
        </form>
      </Modal>

      <Modal open={showNewEvent} onClose={() => setShowNewEvent(false)} title="New Event Booking" size="lg">
        <form onSubmit={handleCreateEvent} className="space-y-3">
          <select value={eventForm.hallId} onChange={(e) => setEventForm({ ...eventForm, hallId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg" required>
            <option value="">Select hall</option>
            {halls.map((h) => <option key={h._id} value={h._id}>{h.name} — ₹{h.pricePerDay}/day</option>)}
          </select>
          <select value={eventForm.eventType} onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg">
            {EVENT_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t.replace(/_/g, ' ')}</option>)}
          </select>
          <Input placeholder="Event name" value={eventForm.eventName} onChange={(e) => setEventForm({ ...eventForm, eventName: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Client name" value={eventForm.clientName} onChange={(e) => setEventForm({ ...eventForm, clientName: e.target.value })} required />
            <Input placeholder="Client phone" value={eventForm.clientPhone} onChange={(e) => setEventForm({ ...eventForm, clientPhone: e.target.value })} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Date" type="date" value={eventForm.eventDate} onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })} required />
            <Input label="Start" type="time" value={eventForm.startTime} onChange={(e) => setEventForm({ ...eventForm, startTime: e.target.value })} required />
            <Input label="End" type="time" value={eventForm.endTime} onChange={(e) => setEventForm({ ...eventForm, endTime: e.target.value })} required />
          </div>
          <Input placeholder="Guest count" type="number" value={eventForm.guestCount} onChange={(e) => setEventForm({ ...eventForm, guestCount: e.target.value })} required />

          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={eventForm.cateringRequested} onChange={(e) => setEventForm({ ...eventForm, cateringRequested: e.target.checked })} /> Catering required</label>
          {eventForm.cateringRequested && <Input placeholder="Cost per plate (₹)" type="number" value={eventForm.costPerPlate} onChange={(e) => setEventForm({ ...eventForm, costPerPlate: e.target.value })} />}

          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={eventForm.decorationRequested} onChange={(e) => setEventForm({ ...eventForm, decorationRequested: e.target.checked })} /> Decoration required</label>
          {eventForm.decorationRequested && <Input placeholder="Decoration cost (₹)" type="number" value={eventForm.decorationCost} onChange={(e) => setEventForm({ ...eventForm, decorationCost: e.target.value })} />}

          <Button variant="gold" className="w-full">Create Booking</Button>
        </form>
      </Modal>

      <Modal open={!!advanceTarget} onClose={() => setAdvanceTarget(null)} title="Record Advance Payment" size="sm">
        <form onSubmit={handleAdvance} className="space-y-3">
          <Input placeholder="Amount (₹)" type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} required />
          <Button variant="gold" className="w-full">Record Advance</Button>
        </form>
      </Modal>
    </div>
  );
}
