import { useEffect, useState } from 'react';
import { Plus, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { equipmentService } from '../../services/equipmentService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';

const CATEGORIES = ['elevator', 'generator', 'hvac', 'boiler', 'fire_safety', 'kitchen_equipment', 'laundry_equipment', 'other'];
const emptyForm = { name: '', category: 'hvac', location: '', serialNumber: '', nextServiceDue: '' };

export default function Equipment() {
  const [items, setItems] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [serviceTarget, setServiceTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [serviceForm, setServiceForm] = useState({ note: '', cost: '', performedBy: '', nextServiceDue: '' });

  const load = () => equipmentService.getAll().then((res) => setItems(res.data.data));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await equipmentService.create(form);
      toast.success('Equipment added');
      setShowNew(false);
      setForm(emptyForm);
      load();
    } catch { toast.error('Failed to add equipment'); }
  };

  const submitService = async (e) => {
    e.preventDefault();
    try {
      await equipmentService.logService(serviceTarget, { ...serviceForm, cost: Number(serviceForm.cost) || 0 });
      toast.success('Service logged');
      setServiceTarget(null);
      setServiceForm({ note: '', cost: '', performedBy: '', nextServiceDue: '' });
      load();
    } catch { toast.error('Failed to log service'); }
  };

  const isOverdue = (r) => r.nextServiceDue && new Date(r.nextServiceDue) < new Date();

  const columns = [
    { key: 'name', label: 'Equipment' },
    { key: 'category', label: 'Category', render: (r) => <span className="capitalize">{r.category.replace(/_/g, ' ')}</span> },
    { key: 'location', label: 'Location' },
    { key: 'lastServiceDate', label: 'Last Serviced', render: (r) => r.lastServiceDate ? new Date(r.lastServiceDate).toLocaleDateString() : '—' },
    { key: 'nextServiceDue', label: 'Next Due', render: (r) => r.nextServiceDue ? <span className={isOverdue(r) ? 'text-danger font-medium' : ''}>{new Date(r.nextServiceDue).toLocaleDateString()}</span> : '—' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status === 'operational' ? 'clean' : r.status === 'out_of_order' ? 'cancelled' : 'pending'} /> },
    { key: 'actions', label: '', render: (r) => <Button className="!px-3 !py-1.5 text-xs flex items-center gap-1" onClick={() => setServiceTarget(r._id)}><Wrench size={13} /> Log Service</Button> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-display mb-1">Equipment</h1><p className="text-text-secondary text-sm">Elevators, generators, HVAC, and other hotel equipment</p></div>
        <Button variant="gold" onClick={() => setShowNew(true)} className="flex items-center gap-2"><Plus size={18} /> Add Equipment</Button>
      </div>

      <Table columns={columns} data={items} emptyMessage="No equipment tracked yet" />

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Add Equipment">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input placeholder="Equipment name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg capitalize">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
          </select>
          <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Input placeholder="Serial number (optional)" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
          <Input label="Next Service Due" type="date" value={form.nextServiceDue} onChange={(e) => setForm({ ...form, nextServiceDue: e.target.value })} />
          <Button variant="gold" className="w-full">Add Equipment</Button>
        </form>
      </Modal>

      <Modal open={!!serviceTarget} onClose={() => setServiceTarget(null)} title="Log Service" size="sm">
        <form onSubmit={submitService} className="space-y-3">
          <Input placeholder="Service note" value={serviceForm.note} onChange={(e) => setServiceForm({ ...serviceForm, note: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Cost (₹)" type="number" value={serviceForm.cost} onChange={(e) => setServiceForm({ ...serviceForm, cost: e.target.value })} />
            <Input placeholder="Performed by" value={serviceForm.performedBy} onChange={(e) => setServiceForm({ ...serviceForm, performedBy: e.target.value })} />
          </div>
          <Input label="Next Service Due" type="date" value={serviceForm.nextServiceDue} onChange={(e) => setServiceForm({ ...serviceForm, nextServiceDue: e.target.value })} />
          <Button variant="gold" className="w-full">Log Service</Button>
        </form>
      </Modal>
    </div>
  );
}
