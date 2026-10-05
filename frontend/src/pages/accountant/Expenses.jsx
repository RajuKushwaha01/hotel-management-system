import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { accountantService } from '../../services/accountantService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

const CATEGORIES = ['electricity', 'water', 'salary', 'food', 'cleaning', 'maintenance', 'internet', 'supplies', 'other'];

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ category: 'electricity', description: '', amount: '' });

  const load = () => accountantService.getExpenses().then((res) => setExpenses(res.data.data));
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await accountantService.createExpense({ ...form, amount: Number(form.amount) });
      toast.success('Expense recorded');
      setShowNew(false);
      setForm({ category: 'electricity', description: '', amount: '' });
      load();
    } catch {
      toast.error('Failed to record expense');
    }
  };

  const handleDelete = async (id) => {
    try {
      await accountantService.deleteExpense(id);
      toast.success('Expense removed');
      load();
    } catch {
      toast.error('Failed to remove');
    }
  };

  const columns = [
    { key: 'category', label: 'Category', render: (r) => <span className="capitalize">{r.category}</span> },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount', render: (r) => `₹${r.amount.toLocaleString()}` },
    { key: 'date', label: 'Date', render: (r) => new Date(r.date).toLocaleDateString() },
    {
      key: 'actions', label: '',
      render: (r) => <button onClick={() => handleDelete(r._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-danger"><Trash2 size={16} /></button>,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-display mb-1">Expenses</h1><p className="text-text-secondary text-sm">Track operational costs</p></div>
        <Button variant="gold" onClick={() => setShowNew(true)} className="flex items-center gap-2"><Plus size={18} /> Add Expense</Button>
      </div>

      <Table columns={columns} data={expenses} emptyMessage="No expenses recorded" />

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Record Expense">
        <form onSubmit={handleCreate} className="space-y-3">
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg">
            {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <Input placeholder="Amount (₹)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <Button variant="gold" className="w-full">Record Expense</Button>
        </form>
      </Modal>
    </div>
  );
}
