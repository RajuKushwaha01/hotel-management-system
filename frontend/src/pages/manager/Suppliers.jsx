import { useEffect, useState } from 'react';
import { Plus, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { procurementService } from '../../services/procurementService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

const PAYMENT_TERMS = ['cash_on_delivery', 'net_15', 'net_30', 'net_45', 'advance'];

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ name: '', contactPerson: '', phone: '', email: '', productsSupplied: '', paymentTerms: 'net_30' });

  const load = () => procurementService.getSuppliers().then((res) => setSuppliers(res.data.data));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await procurementService.createSupplier({ ...form, productsSupplied: form.productsSupplied.split(',').map((p) => p.trim()) });
      toast.success('Supplier added');
      setShowNew(false);
      setForm({ name: '', contactPerson: '', phone: '', email: '', productsSupplied: '', paymentTerms: 'net_30' });
      load();
    } catch { toast.error('Failed to add supplier'); }
  };

  const viewHistory = async (supplier) => {
    setHistoryTarget(supplier);
    const res = await procurementService.getSupplierHistory(supplier._id);
    setHistory(res.data.data);
  };

  const columns = [
    { key: 'name', label: 'Supplier' },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'phone', label: 'Phone' },
    { key: 'productsSupplied', label: 'Products', render: (r) => r.productsSupplied.join(', ') },
    { key: 'paymentTerms', label: 'Terms', render: (r) => <span className="uppercase text-xs">{r.paymentTerms.replace(/_/g, ' ')}</span> },
    { key: 'actions', label: '', render: (r) => <button onClick={() => viewHistory(r)} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"><History size={16} /></button> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-display mb-1">Suppliers</h1><p className="text-text-secondary text-sm">Vendor profiles and purchase history</p></div>
        <Button variant="gold" onClick={() => setShowNew(true)} className="flex items-center gap-2"><Plus size={18} /> Add Supplier</Button>
      </div>

      <Table columns={columns} data={suppliers} emptyMessage="No suppliers added" />

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Add Supplier">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input placeholder="Supplier name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input placeholder="Contact person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <Input placeholder="Products supplied (comma-separated)" value={form.productsSupplied} onChange={(e) => setForm({ ...form, productsSupplied: e.target.value })} required />
          <select value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg">
            {PAYMENT_TERMS.map((t) => <option key={t} value={t} className="uppercase">{t.replace(/_/g, ' ')}</option>)}
          </select>
          <Button variant="gold" className="w-full">Add Supplier</Button>
        </form>
      </Modal>

      <Modal open={!!historyTarget} onClose={() => setHistoryTarget(null)} title={`Purchase History — ${historyTarget?.name}`} size="lg">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {history.length === 0 ? <p className="text-text-secondary text-sm">No purchase orders yet</p> : history.map((po) => (
            <div key={po._id} className="flex justify-between text-sm border-b border-border dark:border-darkBorder pb-2">
              <span>{po.poNumber} — {po.items.length} item(s)</span>
              <span>₹{po.totalCost.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
