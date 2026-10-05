import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { serviceCatalogService } from '../../services/serviceCatalogService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';

const DEPARTMENTS = ['front_desk', 'housekeeping', 'restaurant', 'transport', 'spa', 'events', 'maintenance'];
const emptyForm = { name: '', department: 'front_desk', description: '', price: '', isChargeable: true };

export default function Services() {
  const [services, setServices] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const load = () => serviceCatalogService.getAll().then((res) => setServices(res.data.data));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await serviceCatalogService.create({ ...form, price: Number(form.price) || 0 });
      toast.success('Service added');
      setShowNew(false);
      setForm(emptyForm);
      load();
    } catch { toast.error('Failed to add service'); }
  };

  const toggleActive = async (s) => {
    try {
      await serviceCatalogService.update(s._id, { isActive: !s.isActive });
      load();
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id) => {
    try {
      await serviceCatalogService.delete(id);
      toast.success('Service removed');
      load();
    } catch { toast.error('Failed to remove'); }
  };

  const columns = [
    { key: 'name', label: 'Service' },
    { key: 'department', label: 'Department', render: (r) => <span className="capitalize">{r.department.replace(/_/g, ' ')}</span> },
    { key: 'price', label: 'Price', render: (r) => r.isChargeable ? `₹${r.price}` : 'Complimentary' },
    { key: 'isActive', label: 'Status', render: (r) => (
      <button onClick={() => toggleActive(r)}><StatusBadge status={r.isActive ? 'confirmed' : 'cancelled'} /></button>
    ) },
    { key: 'actions', label: '', render: (r) => <button onClick={() => handleDelete(r._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-danger"><Trash2 size={15} /></button> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-display mb-1">Service Catalog</h1><p className="text-text-secondary text-sm">Every service the hotel offers, its price, and which department owns it</p></div>
        <Button variant="gold" onClick={() => setShowNew(true)} className="flex items-center gap-2"><Plus size={18} /> Add Service</Button>
      </div>

      <Table columns={columns} data={services} emptyMessage="No services in the catalog yet" />

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Add Service">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input placeholder="Service name (e.g. Airport Pickup)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg capitalize">
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
          </select>
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isChargeable} onChange={(e) => setForm({ ...form, isChargeable: e.target.checked })} /> Chargeable
          </label>
          {form.isChargeable && <Input placeholder="Price (₹)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />}
          <Button variant="gold" className="w-full">Add Service</Button>
        </form>
      </Modal>
    </div>
  );
}
