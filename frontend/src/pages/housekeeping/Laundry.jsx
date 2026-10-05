import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { laundryService } from '../../services/laundryService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';

const NEXT = { requested: 'picked_up', picked_up: 'processing', processing: 'ready', ready: 'delivered' };
const ACTION_LABEL = { requested: 'Pick Up', picked_up: 'Start Processing', processing: 'Mark Ready', ready: 'Mark Delivered' };
const SERVICE_TYPES = ['wash', 'dry_clean', 'iron_only', 'wash_and_iron'];

export default function Laundry() {
  const [requests, setRequests] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ guestId: '', bookingId: '', roomNumber: '', serviceType: 'wash_and_iron', items: [{ itemName: '', quantity: 1, pricePerItem: 50 }] });

  const load = () => laundryService.getAll().then((res) => setRequests(res.data.data));
  useEffect(() => { load(); }, []);

  const advance = async (r) => {
    try {
      await laundryService.updateStatus(r._id, NEXT[r.status]);
      toast.success('Status updated');
      load();
    } catch { toast.error('Failed to update'); }
  };

  const addItemRow = () => setForm({ ...form, items: [...form.items, { itemName: '', quantity: 1, pricePerItem: 50 }] });
  const updateItem = (i, field, value) => {
    const items = [...form.items];
    items[i][field] = value;
    setForm({ ...form, items });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await laundryService.create(form);
      toast.success('Laundry request created');
      setShowNew(false);
      setForm({ guestId: '', bookingId: '', roomNumber: '', serviceType: 'wash_and_iron', items: [{ itemName: '', quantity: 1, pricePerItem: 50 }] });
      load();
    } catch { toast.error('Failed to create request'); }
  };

  const columns = [
    { key: 'guest', label: 'Guest', render: (r) => `${r.guest?.firstName} ${r.guest?.lastName}` },
    { key: 'roomNumber', label: 'Room' },
    { key: 'items', label: 'Items', render: (r) => r.items.map((i) => `${i.itemName} ×${i.quantity}`).join(', ') },
    { key: 'totalPrice', label: 'Price', render: (r) => `₹${r.totalPrice}` },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status === 'delivered' ? 'completed' : r.status === 'ready' ? 'clean' : 'pending'} /> },
    {
      key: 'actions', label: 'Actions',
      render: (r) => r.status !== 'delivered' && <Button className="!px-3 !py-1.5 text-xs" onClick={() => advance(r)}>{ACTION_LABEL[r.status]}</Button>,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-display mb-1">Laundry Management</h1><p className="text-text-secondary text-sm">Guest laundry requests and processing workflow</p></div>
        <Button variant="gold" onClick={() => setShowNew(true)} className="flex items-center gap-2"><Plus size={18} /> New Request</Button>
      </div>

      <Table columns={columns} data={requests} emptyMessage="No laundry requests" />

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Laundry Request" size="lg">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input placeholder="Guest ID" value={form.guestId} onChange={(e) => setForm({ ...form, guestId: e.target.value })} required />
          <Input placeholder="Booking ID" value={form.bookingId} onChange={(e) => setForm({ ...form, bookingId: e.target.value })} required />
          <Input placeholder="Room number" value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} required />
          <select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg">
            {SERVICE_TYPES.map((s) => <option key={s} value={s} className="capitalize">{s.replace(/_/g, ' ')}</option>)}
          </select>

          <p className="text-sm font-medium">Items</p>
          {form.items.map((item, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              <Input placeholder="Item name" value={item.itemName} onChange={(e) => updateItem(i, 'itemName', e.target.value)} required />
              <Input placeholder="Qty" type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} required />
              <Input placeholder="Price/item" type="number" value={item.pricePerItem} onChange={(e) => updateItem(i, 'pricePerItem', Number(e.target.value))} required />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addItemRow} className="!py-1.5 text-sm">+ Add Item</Button>

          <Button variant="gold" className="w-full">Create Request</Button>
        </form>
      </Modal>
    </div>
  );
}
