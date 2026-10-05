import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { receptionistService } from '../../services/receptionistService';
import Card from '../../components/ui/Card';

const STATUS_COLOR = { confirmed: 'bg-accentBlue', checked_in: 'bg-success' };

export default function ReservationCalendar() {
  const [grid, setGrid] = useState([]);
  const [days, setDays] = useState([]);

  useEffect(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(from.getDate() + 14);

    receptionistService.getCalendarGrid({ from: from.toISOString(), to: to.toISOString() })
      .then((res) => {
        setGrid(res.data.data.grid);
        const dayList = [];
        for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) dayList.push(new Date(d));
        setDays(dayList);
      })
      .catch(() => toast.error('Failed to load calendar'));
  }, []);

  const isBooked = (roomBookings, day) => {
    return roomBookings.find((b) => {
      const ci = new Date(b.checkIn); const co = new Date(b.checkOut);
      return day >= new Date(ci.setHours(0, 0, 0, 0)) && day < new Date(co.setHours(0, 0, 0, 0));
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">Reservation Calendar</h1>
      <p className="text-text-secondary text-sm mb-6">Room occupancy across the next 14 days</p>

      <Card className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid" style={{ gridTemplateColumns: `120px repeat(${days.length}, 1fr)` }}>
            <div className="font-medium text-sm p-2">Room</div>
            {days.map((d) => (
              <div key={d.toISOString()} className="text-xs text-center p-2 text-text-secondary">
                {d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              </div>
            ))}

            {grid.map(({ room, bookings }) => (
              <>
                <div key={room._id} className="text-sm font-medium p-2 border-t border-border dark:border-darkBorder">
                  {room.roomNumber}
                </div>
                {days.map((day) => {
                  const booking = isBooked(bookings, day);
                  return (
                    <div key={day.toISOString() + room._id} className="p-1 border-t border-border dark:border-darkBorder">
                      {booking ? (
                        <div className={`h-6 rounded ${STATUS_COLOR[booking.status] || 'bg-gray-300'} opacity-80 hover:opacity-100 transition`} title={booking.guestName} />
                      ) : (
                        <div className="h-6 rounded bg-emerald-50 dark:bg-emerald-500/10" />
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-4 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-50 dark:bg-emerald-500/10" /> Available</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-accentBlue" /> Confirmed</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-success" /> Checked In</span>
        </div>
      </Card>
    </div>
  );
}
