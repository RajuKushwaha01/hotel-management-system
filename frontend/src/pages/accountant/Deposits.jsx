import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { depositService } from '../../services/depositService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import StatusBadge from '../../components/ui/StatusBadge';

export default function Deposits() {
  const [deposits, setDeposits] = useState([]);
  const [refundTarget, setRefundTarget] = useState(null);
  const [refundForm, setRefundForm] = useState({ refundAmount: '', refundReason: '', cancellationFee: '' });

  const load = () => depositService.getAll().then((res) => setDeposits(res.data.data));
  useEffect(() => { load(); }, []);

  const act = async (fn, msg) => {
    try { await fn(); toast.success(msg); load(); } catch { toast.error('Action failed'); }
  };

  const submitRefundRequest = async (e) => {
    e.preventDefault();
    await act(() => depositService.requestRefund(refundTarget, {
      refundAmount: Number(refundForm.refundAmount), refundReason: refundForm.refundReason, cancellationFee: Number(refundForm.cancellationFee) || 0,
    }), 'Refund requested');
    setRefundTarget(null);
    setRefundForm({ refundAmount: '', refundReason: '', cancellationFee: '' });
  };

  const columns = [
    { key: 'guest', label: 'Guest', render: (r) => `${r.guest?.firstName} ${r.guest?.lastName}` },
    { key: 'type', label: 'Type', render: (r) => <span className="capitalize">{r.type.replace(/_/g, ' ')}</span> },
    { key: 'amount', label: 'Amount', render: (r) => `₹${r.amount.toLocaleString()}` },
    { key: 'method', label: 'Method', render: (r) => <span className="capitalize">{r.method}</span> },
    {
      key: 'refundStatus', label: 'Refund Status',
      render: (r) => r.refundStatus === 'not_applicable' ? <span className="text-text-secondary text-xs">—</span> : <StatusBadge status={r.refundStatus === 'processed' ? 'completed' : r.refundStatus === 'rejected' ? 'cancelled' : 'pending'} />,
    },
    {
      key: 'actions', label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          {r.refundStatus === 'not_applicable' && <Button className="!px-3 !py-1.5 text-xs" onClick={() => setRefundTarget(r._id)}>Request Refund</Button>}
          {r.refundStatus === 'requested' && <Button className="!px-3 !py-1.5 text-xs" onClick={() => act(() => depositService.approveRefund(r._id), 'Refund approved')}>Approve</Button>}
          {r.refundStatus === 'approved' && <Button variant="gold" className="!px-3 !py-1.5 text-xs" onClick={() => act(() => depositService.processRefund(r._id), 'Refund processed')}>Process</Button>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">Deposits & Refunds</h1>
      <p className="text-text-secondary text-sm mb-6">Booking advances, security deposits, and refund workflow</p>

      <Table columns={columns} data={deposits} emptyMessage="No deposits recorded" />

      <Modal open={!!refundTarget} onClose={() => setRefundTarget(null)} title="Request Refund" size="sm">
        <form onSubmit={submitRefundRequest} className="space-y-3">
          <Input placeholder="Refund amount (₹)" type="number" value={refundForm.refundAmount} onChange={(e) => setRefundForm({ ...refundForm, refundAmount: e.target.value })} required />
          <Input placeholder="Cancellation fee (₹, if any)" type="number" value={refundForm.cancellationFee} onChange={(e) => setRefundForm({ ...refundForm, cancellationFee: e.target.value })} />
          <Input placeholder="Reason" value={refundForm.refundReason} onChange={(e) => setRefundForm({ ...refundForm, refundReason: e.target.value })} required />
          <Button variant="gold" className="w-full">Submit Request</Button>
        </form>
      </Modal>
    </div>
  );
}
