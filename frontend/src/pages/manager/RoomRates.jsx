import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { rateService } from '../../services/rateService';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import Modal from '../../components/ui/Modal';
import Tabs from '../../components/ui/Tabs';

const ROOM_TYPES = ['single', 'double', 'twin', 'deluxe', 'suite', 'family', 'executive', 'presidential'];
const PLAN_TYPES = ['seasonal', 'holiday', 'corporate', 'promotional'];

export default function RoomRates() {
  const [rates, setRates] = useState([]);
  const [plans, setPlans] = useState([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', type: 'seasonal', roomType: 'deluxe', rate: '', startDate: '', endDate: '', promoCode: '', companyName: '' });

  const load = () => {
    rateService.getRoomRates().then((res) => {
      const map = {};
      ROOM_TYPES.forEach((t) => { map[t] = res.data.data.find((r) => r.roomType === t) || { roomType: t, standardRate: '', weekendRate: '', extraGuestCharge: 500, extraBedCharge: 800, childCharge: 300 }; });
      setRates(Object.values(map));
    });
    rateService.getRatePlans().then((res) => setPlans(res.data.data));
  };
  useEffect(() => { load(); }, []);

  const updateField = (roomType, field, value) => {
    setRates((prev) => prev.map((r) => (r.roomType === roomType ? { ...r, [field]: value } : r)));
  };

  const saveRate = async (rate) => {
    try {
      await rateService.upsertRoomRate({
        ...rate,
        standardRate: Number(rate.standardRate),
        weekendRate: Number(rate.weekendRate),
        extraGuestCharge: Number(rate.extraGuestCharge),
        extraBedCharge: Number(rate.extraBedCharge),
        childCharge: Number(rate.childCharge),
      });
      toast.success(`${rate.roomType} rate saved`);
    } catch {
      toast.error('Failed to save rate');
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      await rateService.createRatePlan({ ...planForm, rate: Number(planForm.rate) });
      toast.success('Rate plan created');
      setShowPlanModal(false);
      setPlanForm({ name: '', type: 'seasonal', roomType: 'deluxe', rate: '', startDate: '', endDate: '', promoCode: '', companyName: '' });
      load();
    } catch {
      toast.error('Failed to create plan');
    }
  };

  const handleDeletePlan = async (id) => {
    try {
      await rateService.deleteRatePlan(id);
      toast.success('Plan removed');
      load();
    } catch {
      toast.error('Failed to remove plan');
    }
  };

  const planColumns = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type', render: (r) => <span className="capitalize">{r.type}</span> },
    { key: 'roomType', label: 'Room Type', render: (r) => <span className="capitalize">{r.roomType}</span> },
    { key: 'rate', label: 'Rate', render: (r) => `₹${r.rate}` },
    { key: 'validity', label: 'Validity', render: (r) => r.startDate ? `${new Date(r.startDate).toLocaleDateString()} - ${new Date(r.endDate).toLocaleDateString()}` : (r.promoCode || r.companyName) },
    { key: 'actions', label: '', render: (r) => <button onClick={() => handleDeletePlan(r._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-danger"><Trash2 size={16} /></button> },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">Room Rate Management</h1>
      <p className="text-text-secondary text-sm mb-6">Standard rates, weekend pricing, and special rate plans</p>

      <Tabs
        tabs={[
          {
            id: 'base', label: 'Base Rates',
            content: (
              <div className="space-y-4">
                {rates.map((rate) => (
                  <Card key={rate.roomType}>
                    <h3 className="font-semibold capitalize mb-3">{rate.roomType} Room</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <Input placeholder="Standard (₹)" type="number" value={rate.standardRate} onChange={(e) => updateField(rate.roomType, 'standardRate', e.target.value)} />
                      <Input placeholder="Weekend (₹)" type="number" value={rate.weekendRate} onChange={(e) => updateField(rate.roomType, 'weekendRate', e.target.value)} />
                      <Input placeholder="Extra Guest (₹)" type="number" value={rate.extraGuestCharge} onChange={(e) => updateField(rate.roomType, 'extraGuestCharge', e.target.value)} />
                      <Input placeholder="Extra Bed (₹)" type="number" value={rate.extraBedCharge} onChange={(e) => updateField(rate.roomType, 'extraBedCharge', e.target.value)} />
                      <Input placeholder="Child (₹)" type="number" value={rate.childCharge} onChange={(e) => updateField(rate.roomType, 'childCharge', e.target.value)} />
                    </div>
                    <Button variant="gold" className="mt-3 !px-4 !py-1.5 text-sm" onClick={() => saveRate(rate)}>Save</Button>
                  </Card>
                ))}
              </div>
            ),
          },
          {
            id: 'plans', label: 'Special Rate Plans',
            content: (
              <div>
                <Button variant="gold" className="mb-4 flex items-center gap-2" onClick={() => setShowPlanModal(true)}><Plus size={16} /> New Rate Plan</Button>
                <Table columns={planColumns} data={plans} emptyMessage="No special rate plans configured" />
              </div>
            ),
          },
        ]}
      />

      <Modal open={showPlanModal} onClose={() => setShowPlanModal(false)} title="New Rate Plan">
        <form onSubmit={handleCreatePlan} className="space-y-3">
          <Input placeholder="Plan name (e.g. Diwali Festival Rate)" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-3">
            <select value={planForm.type} onChange={(e) => setPlanForm({ ...planForm, type: e.target.value })} className="px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg capitalize">
              {PLAN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={planForm.roomType} onChange={(e) => setPlanForm({ ...planForm, roomType: e.target.value })} className="px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg capitalize">
              {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <Input placeholder="Rate (₹)" type="number" value={planForm.rate} onChange={(e) => setPlanForm({ ...planForm, rate: e.target.value })} required />

          {['seasonal', 'holiday'].includes(planForm.type) && (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Start Date" type="date" value={planForm.startDate} onChange={(e) => setPlanForm({ ...planForm, startDate: e.target.value })} required />
              <Input label="End Date" type="date" value={planForm.endDate} onChange={(e) => setPlanForm({ ...planForm, endDate: e.target.value })} required />
            </div>
          )}
          {planForm.type === 'promotional' && <Input placeholder="Promo code" value={planForm.promoCode} onChange={(e) => setPlanForm({ ...planForm, promoCode: e.target.value })} required />}
          {planForm.type === 'corporate' && <Input placeholder="Company name" value={planForm.companyName} onChange={(e) => setPlanForm({ ...planForm, companyName: e.target.value })} required />}

          <Button variant="gold" className="w-full">Create Plan</Button>
        </form>
      </Modal>
    </div>
  );
}
