import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { housekeepingService } from '../../services/housekeepingService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';

export default function LostFound() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ itemDescription: '', foundLocation: '' });

  const load = () => {
    setLoading(true);
    housekeepingService.getLostFound().then((res) => setItems(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await housekeepingService.createLostFound(form);
      toast.success('Item logged');
      setShowNew(false);
      setForm({ itemDescription: '', foundLocation: '' });
      load();
    } catch {
      toast.error('Failed to log item');
    }
  };

  const handleClaim = async (id) => {
    const name = prompt('Handed over to (name):');
    if (!name) return;
    try {
      await housekeepingService.updateLostFoundStatus(id, { status: 'claimed', handedToName: name });
      toast.success('Marked as claimed');
      load();
    } catch {
      toast.error('Failed to update');
    }
  };

  const columns = [
    { key: 'itemDescription', label: 'Item' },
    { key: 'foundLocation', label: 'Location' },
    { key: 'foundDate', label: 'Date', render: (r) => new Date(r.foundDate).toLocaleDateString() },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status === 'stored' ? 'pending' : r.status === 'claimed' ? 'clean' : 'cancelled'} /> },
    {
      key: 'actions', label: 'Actions',
      render: (r) => r.status === 'stored' && <Button className="!px-3 !py-1.5 text-xs" onClick={() => handleClaim(r._id)}>Mark Claimed</Button>,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-display mb-1">Lost & Found</h1><p className="text-text-secondary text-sm">Track found items and handovers</p></div>
        <Button variant="gold" onClick={() => setShowNew(true)} className="flex items-center gap-2"><Plus size={18} /> Log Item</Button>
      </div>

      <Table columns={columns} data={items} loading={loading} emptyMessage="No items logged" />

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Log Found Item">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input placeholder="Item description" value={form.itemDescription} onChange={(e) => setForm({ ...form, itemDescription: e.target.value })} required />
          <Input placeholder="Found location (e.g. Room 204)" value={form.foundLocation} onChange={(e) => setForm({ ...form, foundLocation: e.target.value })} required />
          <Button variant="gold" className="w-full">Log Item</Button>
        </form>
      </Modal>
    </div>
  );
}
