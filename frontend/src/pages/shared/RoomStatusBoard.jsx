import { useEffect, useState } from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { roomManagementService } from '../../services/roomManagementService';
import { useSocket } from '../../context/SocketContext';

const STATUS_STYLE = {
  available: 'bg-emerald-500', reserved: 'bg-blue-500', occupied: 'bg-red-500', dirty: 'bg-orange-500',
  cleaning: 'bg-amber-500', inspection: 'bg-purple-500', maintenance: 'bg-slate-500', out_of_order: 'bg-red-800', blocked: 'bg-gray-600',
};

export default function RoomStatusBoard() {
  const [rooms, setRooms] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const { socket, connected } = useSocket();

  const load = () => roomManagementService.getAll({ limit: 500 }).then((res) => setRooms(res.data.data));

  useEffect(() => {
    load();
    if (socket) socket.emit('join-room', 'rooms-board');
  }, [socket]);

  // The whole point of this screen: no manual refresh needed — updates arrive the instant
  // reception checks someone in, housekeeping marks a room clean, or a room is blocked.
  useEffect(() => {
    if (!socket) return;
    const onChange = ({ roomId, roomNumber, status }) => {
      setRooms((prev) => prev.map((r) => (r._id === roomId ? { ...r, status } : r)));
      setLastUpdate(new Date());
      toast(`Room ${roomNumber} → ${status.replace(/_/g, ' ')}`, { icon: '🔄', duration: 2500 });
    };
    socket.on('room-status-changed', onChange);
    return () => socket.off('room-status-changed', onChange);
  }, [socket]);

  const byFloor = rooms.reduce((acc, r) => { (acc[r.floor] = acc[r.floor] || []).push(r); return acc; }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display mb-1">Room Status Board</h1>
          <p className="text-text-secondary text-sm">Live view — updates instantly across every connected device</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {connected ? <Wifi size={14} className="text-success" /> : <WifiOff size={14} className="text-danger" />}
          <span className="text-text-secondary">{connected ? 'Live' : 'Reconnecting...'}</span>
          {lastUpdate && <span className="text-text-secondary">· updated {lastUpdate.toLocaleTimeString()}</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6 text-xs">
        {Object.entries(STATUS_STYLE).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${color}`} /> <span className="capitalize">{status.replace(/_/g, ' ')}</span></span>
        ))}
      </div>

      {Object.entries(byFloor).sort(([a], [b]) => a - b).map(([floor, floorRooms]) => (
        <div key={floor} className="mb-6">
          <p className="text-xs font-medium text-text-secondary mb-2">Floor {floor}</p>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
            {floorRooms.map((r) => (
              <div
                key={r._id}
                className={`aspect-square rounded-xl ${STATUS_STYLE[r.status]} flex items-center justify-center text-white text-xs font-bold transition-all duration-500 hover:scale-105 cursor-default animate-fade-in`}
                title={`Room ${r.roomNumber} — ${r.status.replace(/_/g, ' ')}`}
              >
                {r.roomNumber}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
