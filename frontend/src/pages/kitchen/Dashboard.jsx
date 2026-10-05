import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { kitchenService } from '../../services/kitchenService';
import { useSocket } from '../../context/SocketContext';

const COLUMNS = [
  { status: 'new', label: 'NEW', color: 'border-accentBlue' },
  { status: 'accepted', label: 'ACCEPTED', color: 'border-accentPurple' },
  { status: 'preparing', label: 'PREPARING', color: 'border-warning' },
  { status: 'ready', label: 'READY', color: 'border-success' },
];

const NEXT_STATUS = { new: 'accepted', accepted: 'preparing', preparing: 'ready', ready: 'served' };
const ACTION_LABEL = { new: 'Accept', accepted: 'Start Cooking', preparing: 'Mark Ready', ready: 'Mark Served' };

export default function KitchenDashboard() {
  const [orders, setOrders] = useState([]);
  const { socket } = useSocket();

  const load = () => kitchenService.getKOTs().then((res) => setOrders(res.data.data));

  useEffect(() => {
    load();
  }, []);

  // Real-time: new order arrives instantly, no refresh needed
  useEffect(() => {
    if (!socket) return;
    const onNewKOT = (order) => {
      setOrders((prev) => [order, ...prev]);
      toast.success(`New order — Table ${order.table?.tableNumber || order.roomNumber}`, { icon: '🍽️' });
    };
    socket.on('new-kot', onNewKOT);
    return () => socket.off('new-kot', onNewKOT);
  }, [socket]);

  const advance = async (order) => {
    const nextStatus = NEXT_STATUS[order.status];
    try {
      await kitchenService.updateKOTStatus(order._id, { status: nextStatus });
      setOrders((prev) => prev.map((o) => (o._id === order._id ? { ...o, status: nextStatus } : o)).filter((o) => o.status !== 'served'));
    } catch {
      toast.error('Failed to update order');
    }
  };

  const cancel = async (order) => {
    const reason = prompt('Cancellation reason:');
    if (!reason) return;
    try {
      await kitchenService.updateKOTStatus(order._id, { status: 'cancelled', cancelReason: reason });
      setOrders((prev) => prev.filter((o) => o._id !== order._id));
    } catch {
      toast.error('Failed to cancel order');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">Kitchen Display</h1>
      <p className="text-text-secondary text-sm mb-6">Live order feed — updates in real time</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.status} className="space-y-3">
            <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">
              {col.label} ({orders.filter((o) => o.status === col.status).length})
            </h3>
            {orders.filter((o) => o.status === col.status).map((order) => (
              <div key={order._id} className={`bg-white dark:bg-darkCard border-l-4 ${col.color} rounded-xl p-4 shadow-sm animate-fade-in`}>
                <p className="font-bold mb-2">
                  ORDER #{order._id.slice(-4).toUpperCase()}
                  {order.priority === 'urgent' && <span className="ml-2 text-xs text-danger">URGENT</span>}
                </p>
                <p className="text-xs text-text-secondary mb-3">
                  {order.table ? `Table ${order.table.tableNumber}` : `Room ${order.roomNumber}`}
                </p>
                <ul className="text-sm space-y-1 mb-4">
                  {order.items.filter((i) => !i.cancelled).map((i) => (
                    <li key={i._id}>{i.name} × {i.quantity}</li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <button
                    onClick={() => advance(order)}
                    className="flex-1 bg-gradient-to-r from-navy to-deepNavy text-white text-xs font-medium py-2 rounded-lg hover:shadow-lg transition"
                  >
                    {ACTION_LABEL[order.status]}
                  </button>
                  <button onClick={() => cancel(order)} className="px-3 py-2 rounded-lg border border-danger text-danger text-xs hover:bg-danger/10 transition">
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
