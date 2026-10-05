import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewComplaintService } from '../../services/reviewComplaintService';
import { adminService } from '../../services/adminService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Tabs from '../../components/ui/Tabs';
import StatusBadge from '../../components/ui/StatusBadge';

export default function ReviewsComplaints() {
  const [reviews, setReviews] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [respondTarget, setRespondTarget] = useState(null); // { type: 'review'|'complaint', id }
  const [responseText, setResponseText] = useState('');
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignTo, setAssignTo] = useState('');
  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const load = () => {
    reviewComplaintService.getReviews().then((res) => setReviews(res.data.data));
    reviewComplaintService.getComplaints().then((res) => setComplaints(res.data.data));
    adminService.getUsers({ limit: 100 }).then((res) => setStaffList(res.data.data.filter((u) => u.role !== 'customer')));
  };
  useEffect(() => { load(); }, []);

  const act = async (fn, msg) => { try { await fn(); toast.success(msg); load(); } catch { toast.error('Action failed'); } };

  const submitResponse = async (e) => {
    e.preventDefault();
    if (respondTarget.type === 'review') {
      await act(() => reviewComplaintService.respondToReview(respondTarget.id, responseText), 'Response posted');
    } else {
      await act(() => reviewComplaintService.respondToComplaint(respondTarget.id, responseText), 'Response sent');
    }
    setRespondTarget(null);
    setResponseText('');
  };

  const submitAssign = async (e) => {
    e.preventDefault();
    await act(() => reviewComplaintService.assignComplaint(assignTarget, assignTo), 'Complaint assigned');
    setAssignTarget(null);
    setAssignTo('');
  };

  const submitResolve = async (e) => {
    e.preventDefault();
    await act(() => reviewComplaintService.resolveComplaint(resolveTarget, resolutionNote), 'Complaint resolved');
    setResolveTarget(null);
    setResolutionNote('');
  };

  const reviewColumns = [
    { key: 'guest', label: 'Guest', render: (r) => `${r.guest?.firstName} ${r.guest?.lastName}` },
    { key: 'rating', label: 'Rating', render: (r) => '★'.repeat(r.rating) },
    { key: 'comment', label: 'Comment' },
    { key: 'isPublished', label: 'Visibility', render: (r) => <StatusBadge status={r.isPublished ? 'confirmed' : 'cancelled'} /> },
    {
      key: 'actions', label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          <Button className="!px-2 !py-1 text-xs" onClick={() => setRespondTarget({ type: 'review', id: r._id })}>{r.managerResponse ? 'Edit Response' : 'Respond'}</Button>
          <button onClick={() => act(() => reviewComplaintService.togglePublish(r._id), 'Visibility updated')} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
            {r.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      ),
    },
  ];

  const complaintColumns = [
    { key: 'guest', label: 'Guest', render: (r) => `${r.guest?.firstName} ${r.guest?.lastName}` },
    { key: 'subject', label: 'Subject' },
    { key: 'assignedTo', label: 'Assigned To', render: (r) => r.assignedTo ? `${r.assignedTo.firstName} ${r.assignedTo.lastName}` : '—' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status === 'resolved' || r.status === 'closed' ? 'completed' : r.status === 'open' ? 'pending' : 'confirmed'} /> },
    {
      key: 'actions', label: 'Actions',
      render: (r) => (
        <div className="flex gap-2 flex-wrap">
          {r.status === 'open' && <Button className="!px-2 !py-1 text-xs" onClick={() => setAssignTarget(r._id)}>Assign</Button>}
          {['assigned', 'in_progress'].includes(r.status) && <Button className="!px-2 !py-1 text-xs" onClick={() => setRespondTarget({ type: 'complaint', id: r._id })}>Respond</Button>}
          {['assigned', 'in_progress'].includes(r.status) && <Button variant="gold" className="!px-2 !py-1 text-xs" onClick={() => setResolveTarget(r._id)}>Resolve</Button>}
          {r.status === 'resolved' && <Button variant="outline" className="!px-2 !py-1 text-xs" onClick={() => act(() => reviewComplaintService.closeComplaint(r._id), 'Complaint closed')}>Close</Button>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-6">Reviews & Complaints</h1>

      <Tabs
        tabs={[
          { id: 'reviews', label: 'Reviews', content: <Table columns={reviewColumns} data={reviews} emptyMessage="No reviews yet" /> },
          { id: 'complaints', label: 'Complaints', content: <Table columns={complaintColumns} data={complaints} emptyMessage="No complaints" /> },
        ]}
      />

      <Modal open={!!respondTarget} onClose={() => setRespondTarget(null)} title="Send Response">
        <form onSubmit={submitResponse} className="space-y-3">
          <Input placeholder="Your response..." value={responseText} onChange={(e) => setResponseText(e.target.value)} required />
          <Button variant="gold" className="w-full">Send Response</Button>
        </form>
      </Modal>

      <Modal open={!!assignTarget} onClose={() => setAssignTarget(null)} title="Assign Complaint" size="sm">
        <form onSubmit={submitAssign} className="space-y-3">
          <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg" required>
            <option value="">Select staff</option>
            {staffList.map((s) => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.role})</option>)}
          </select>
          <Button variant="gold" className="w-full">Assign</Button>
        </form>
      </Modal>

      <Modal open={!!resolveTarget} onClose={() => setResolveTarget(null)} title="Resolve Complaint" size="sm">
        <form onSubmit={submitResolve} className="space-y-3">
          <Input placeholder="Resolution note" value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} required />
          <Button variant="gold" className="w-full">Mark Resolved</Button>
        </form>
      </Modal>
    </div>
  );
}
