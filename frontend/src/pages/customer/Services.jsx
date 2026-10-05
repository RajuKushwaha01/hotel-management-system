import { useEffect, useState } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { customerService } from '../../services/customerService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Tabs from '../../components/ui/Tabs';
import StatusBadge from '../../components/ui/StatusBadge';

const TYPES = { room_service: 'Room Service', taxi: 'Taxi', extra_bed: 'Extra Bed', guest_request: 'Other Request' };

export default function Services() {
  const [requests, setRequests] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [showRequest, setShowRequest] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  const [requestForm, setRequestForm] = useState({ type: 'room_service', details: '' });
  const [complaintForm, setComplaintForm] = useState({ subject: '', description: '' });

  const load = () => {
    customerService.getServiceRequests().then((res) => setRequests(res.data.data));
    customerService.getComplaints().then((res) => setComplaints(res.data.data));
  };
  useEffect(() => { load(); }, []);

  const submitRequest = async (e) => {
    e.preventDefault();
    try {
      await customerService.createServiceRequest(requestForm);
      toast.success('Request submitted');
      setShowRequest(false);
      setRequestForm({ type: 'room_service', details: '' });
      load();
    } catch { toast.error('Failed to submit'); }
  };

  const submitComplaint = async (e) => {
    e.preventDefault();
    try {
      await customerService.createComplaint(complaintForm);
      toast.success('Complaint registered');
      setShowComplaint(false);
      setComplaintForm({ subject: '', description: '' });
      load();
    } catch { toast.error('Failed to submit'); }
  };

  const reqColumns = [
    { key: 'type', label: 'Type', render: (r) => TYPES[r.type] || r.type },
    { key: 'details', label: 'Details' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  const complaintColumns = [
    { key: 'subject', label: 'Subject' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-6">Services</h1>

      <Tabs
        tabs={[
          {
            id: 'requests', label: 'My Requests',
            content: (
              <div>
                <Button variant="gold" className="mb-4 flex items-center gap-2" onClick={() => setShowRequest(true)}><Plus size={16} /> New Request</Button>
                <Table columns={reqColumns} data={requests} emptyMessage="No service requests yet" />
              </div>
            ),
          },
          {
            id: 'complaints', label: 'Complaints',
            content: (
              <div>
                <Button variant="outline" className="mb-4 flex items-center gap-2" onClick={() => setShowComplaint(true)}><MessageSquare size={16} /> Register Complaint</Button>
                <Table columns={complaintColumns} data={complaints} emptyMessage="No complaints registered" />
              </div>
            ),
          },
        ]}
      />

      <Modal open={showRequest} onClose={() => setShowRequest(false)} title="New Service Request">
        <form onSubmit={submitRequest} className="space-y-3">
          <select value={requestForm.type} onChange={(e) => setRequestForm({ ...requestForm, type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg">
            {Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <Input placeholder="Details" value={requestForm.details} onChange={(e) => setRequestForm({ ...requestForm, details: e.target.value })} required />
          <Button variant="gold" className="w-full">Submit Request</Button>
        </form>
      </Modal>

      <Modal open={showComplaint} onClose={() => setShowComplaint(false)} title="Register Complaint">
        <form onSubmit={submitComplaint} className="space-y-3">
          <Input placeholder="Subject" value={complaintForm.subject} onChange={(e) => setComplaintForm({ ...complaintForm, subject: e.target.value })} required />
          <Input placeholder="Description" value={complaintForm.description} onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })} required />
          <Button variant="gold" className="w-full">Submit Complaint</Button>
        </form>
      </Modal>
    </div>
  );
}
