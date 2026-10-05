import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { accountantService } from '../../services/accountantService';
import Table from '../../components/ui/Table';
import StatusBadge from '../../components/ui/StatusBadge';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    accountantService.getPayments().then((res) => setPayments(res.data.data)).catch(() => toast.error('Failed to load payments')).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: 'guest', label: 'Guest', render: (r) => `${r.guest?.firstName} ${r.guest?.lastName}` },
    { key: 'amount', label: 'Amount', render: (r) => `₹${r.amount.toLocaleString()}` },
    { key: 'method', label: 'Method', render: (r) => <span className="capitalize">{r.method}</span> },
    { key: 'note', label: 'Note', render: (r) => r.note || '—' },
    { key: 'date', label: 'Date', render: (r) => new Date(r.createdAt).toLocaleString() },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">Payments</h1>
      <p className="text-text-secondary text-sm mb-6">All payments collected across cash, card, UPI and bank transfer</p>
      <Table columns={columns} data={payments} loading={loading} emptyMessage="No payments recorded" />
    </div>
  );
}
