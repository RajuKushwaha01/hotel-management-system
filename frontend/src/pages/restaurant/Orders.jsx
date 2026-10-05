import { useEffect, useState } from 'react';
import { Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { restaurantService } from '../../services/restaurantService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [tables, setTables] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [tableId, setTableId] = useState('');
  const [cart, setCart] = useState([]);

  const load = () => restaurantService.getOrders().then((res) => setOrders(res.data.data));

  useEffect(() => {
    load();
    restaurantService.getMenu().then((res) => setMenu(res.data.data));
    restaurantService.getTables().then((res) => setTables(res.data.data));
  }, []);

  const addToCart = (item) => {
    setCart((prev) => {
      const found = prev.find((c) => c.menuItemId === item._id);
      if (found) return prev.map((c) => (c.menuItemId === item._id ? { ...c, quantity: c.quantity + 1 } : c));
      return [...prev, { menuItemId: item._id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const handleCreateOrder = async () => {
    if (!tableId || cart.length === 0) return toast.error('Select a table and add items');
    try {
      await restaurantService.createOrder({ orderType: 'dine_in', tableId, items: cart });
      toast.success('Order sent to kitchen');
      setShowNew(false);
      setCart([]);
      setTableId('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order');
    }
  };

  const handleServe = async (id) => {
    try {
      await restaurantService.serveOrder(id);
      toast.success('Order served');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to serve');
    }
  };

  const columns = [
    { key: 'table', label: 'Table', render: (r) => r.table?.tableNumber || r.roomNumber || '—' },
    { key: 'items', label: 'Items', render: (r) => r.items.filter((i) => !i.cancelled).map((i) => `${i.name} ×${i.quantity}`).join(', ') },
    { key: 'total', label: 'Total', render: (r) => `₹${r.total}` },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status === 'ready' ? 'clean' : r.status === 'served' ? 'completed' : 'pending'} /> },
    {
      key: 'actions', label: 'Actions',
      render: (r) => r.status === 'ready' && (
        <Button variant="gold" className="!px-3 !py-1.5 text-xs flex items-center gap-1" onClick={() => handleServe(r._id)}>
          <Check size={14} /> Serve
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-display mb-1">Orders</h1><p className="text-text-secondary text-sm">Send orders to kitchen and track service</p></div>
        <Button variant="gold" onClick={() => setShowNew(true)} className="flex items-center gap-2"><Plus size={18} /> New Order</Button>
      </div>

      <Table columns={columns} data={orders} emptyMessage="No active orders" />

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Order" size="lg">
        <select value={tableId} onChange={(e) => setTableId(e.target.value)} className="w-full mb-4 px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg">
          <option value="">Select table</option>
          {tables.map((t) => <option key={t._id} value={t._id}>Table {t.tableNumber}</option>)}
        </select>

        <div className="grid sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto mb-4">
          {menu.map((item) => (
            <button key={item._id} onClick={() => addToCart(item)} className="flex justify-between items-center px-3 py-2 rounded-lg border border-border dark:border-darkBorder hover:border-gold text-sm text-left">
              <span>{item.name}</span><span className="text-gold font-medium">₹{item.price}</span>
            </button>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-bgLight dark:bg-darkBg space-y-1">
            {cart.map((c) => (
              <div key={c.menuItemId} className="flex justify-between text-sm">
                <span>{c.name} ×{c.quantity}</span><span>₹{c.price * c.quantity}</span>
              </div>
            ))}
          </div>
        )}

        <Button variant="gold" className="w-full" onClick={handleCreateOrder}>Send to Kitchen</Button>
      </Modal>
    </div>
  );
}
