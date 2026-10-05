import { useEffect, useState } from 'react';
import { Plus, Check, X, Truck, PackageCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { procurementService } from '../../services/procurementService';
import { inventoryService } from '../../services/inventoryService';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Tabs from '../../components/ui/Tabs';
import StatusBadge from '../../components/ui/StatusBadge';

export default function Procurement() {
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showNewPO, setShowNewPO] = useState(false);
  const [requestForm, setRequestForm] = useState({ itemId: '', requestedQuantity: '', reason: 'Low stock' });
  const [poForm, setPOForm] = useState({ supplierId: '', purchaseRequestId: '', items: [{ itemId: '', quantity: '', unitCost: '' }] });

  const load = () => {
    procurementService.getRequests().then((res) => setRequests(res.data.data));
    procurementService.getOrders().then((res) => setOrders(res.data.data));
    procurementService.getSuppliers().then((res) => setSuppliers(res.data.data));
    inventoryService.getItems().then((res) => setItems(res.data.data));
  };
  useEffect(() => { load(); }, []);

  const act = async (fn, msg) => { try { await fn(); toast.success(msg); load(); } catch { toast.error('Action failed'); } };

  const submitRequest = async (e) => {
    e.preventDefault();
    await act(() => procurementService.createRequest({ ...requestForm, requestedQuantity: Number(requestForm.requestedQuantity) }), 'Purchase request submitted');
    setShowNewRequest(false);
    setRequestForm({ itemId: '', requestedQuantity: '', reason: 'Low stock' });
  };

  const addPOItemRow = () => setPOForm({ ...poForm, items: [...poForm.items, { itemId: '', quantity: '', unitCost: '' }] });
  const updatePOItem = (i, field, value) => {
    const arr = [...poForm.items]; arr[i][field] = value; setPOForm({ ...poForm, items: arr });
  };

  const submitPO = async (e) => {
    e.preventDefault();
    await act(() => procurementService.createOrder({
      supplierId: poForm.supplierId,
      purchaseRequestId: poForm.purchaseRequestId || undefined,
      items: poForm.items.map((i) => ({ itemId: i.itemId, quantity: Number(i.quantity), unitCost: Number(i.unitCost) })),
    }), 'Purchase order created');
    setShowNewPO(false);
    setPOForm({ supplierId: '', purchaseRequestId: '', items: [{ itemId: '', quantity: '', unitCost: '' }] });
  };

  const requestColumns = [
    { key: 'item', label: 'Item', render: (r) => r.item?.name },
    { key: 'requestedQuantity', label: 'Qty', render: (r) => `${r.requestedQuantity} ${r.item?.unit}` },
    { key: 'reason', label: 'Reason' },
    { key: 'requestedBy', label: 'Requested By', render: (r) => `${r.requestedBy?.firstName} ${r.requestedBy?.lastName}` },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status === 'approved' ? 'confirmed' : r.status === 'rejected' ? 'cancelled' : 'pending'} /> },
    {
      key: 'actions', label: 'Actions',
      render: (r) => r.status === 'pending' && (
        <div className="flex gap-2">
          <button onClick={() => act(() => procurementService.approveRequest(r._id), 'Approved')} className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20"><Check size={16} /></button>
          <button onClick={() => act(() => procurementService.rejectRequest(r._id, 'Not needed'), 'Rejected')} className="p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20"><X size={16} /></button>
        </div>
      ),
    },
  ];

  const orderColumns = [
    { key: 'poNumber', label: 'PO Number' },
    { key: 'supplier', label: 'Supplier', render: (r) => r.supplier?.name },
    { key: 'items', label: 'Items', render: (r) => r.items.map((i) => i.item?.name).join(', ') },
    { key: 'totalCost', label: 'Total', render: (r) => `₹${r.totalCost.toLocaleString()}` },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status === 'goods_received' || r.status === 'closed' ? 'completed' : 'pending'} /> },
    {
      key: 'actions', label: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          {r.status === 'created' && <Button className="!px-3 !py-1.5 text-xs flex items-center gap-1" onClick={() => act(() => procurementService.sendToSupplier(r._id), 'Sent to supplier')}><Truck size={14} /> Send</Button>}
          {r.status === 'sent_to_supplier' && <Button variant="gold" className="!px-3 !py-1.5 text-xs flex items-center gap-1" onClick={() => act(() => procurementService.receiveGoods(r._id), 'Goods received & inventory updated')}><PackageCheck size={14} /> Receive Goods</Button>}
          {r.status === 'goods_received' && <Button variant="outline" className="!px-3 !py-1.5 text-xs" onClick={() => act(() => procurementService.closeOrder(r._id), 'Order closed')}>Close</Button>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-display mb-1">Procurement</h1>
      <p className="text-text-secondary text-sm mb-6">Low Stock → Request → Approval → PO → Supplier → Goods Received → Inventory Updated</p>

      <Tabs
        tabs={[
          {
            id: 'requests', label: 'Purchase Requests',
            content: (
              <div>
                <Button variant="gold" className="mb-4 flex items-center gap-2" onClick={() => setShowNewRequest(true)}><Plus size={16} /> New Request</Button>
                <Table columns={requestColumns} data={requests} emptyMessage="No purchase requests" />
              </div>
            ),
          },
          {
            id: 'orders', label: 'Purchase Orders',
            content: (
              <div>
                <Button variant="gold" className="mb-4 flex items-center gap-2" onClick={() => setShowNewPO(true)}><Plus size={16} /> New Purchase Order</Button>
                <Table columns={orderColumns} data={orders} emptyMessage="No purchase orders" />
              </div>
            ),
          },
        ]}
      />

      <Modal open={showNewRequest} onClose={() => setShowNewRequest(false)} title="New Purchase Request">
        <form onSubmit={submitRequest} className="space-y-3">
          <select value={requestForm.itemId} onChange={(e) => setRequestForm({ ...requestForm, itemId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg" required>
            <option value="">Select item</option>
            {items.map((i) => <option key={i._id} value={i._id}>{i.name} — {i.currentStock} {i.unit} left</option>)}
          </select>
          <Input placeholder="Quantity needed" type="number" value={requestForm.requestedQuantity} onChange={(e) => setRequestForm({ ...requestForm, requestedQuantity: e.target.value })} required />
          <Input placeholder="Reason" value={requestForm.reason} onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })} />
          <Button variant="gold" className="w-full">Submit Request</Button>
        </form>
      </Modal>

      <Modal open={showNewPO} onClose={() => setShowNewPO(false)} title="New Purchase Order" size="lg">
        <form onSubmit={submitPO} className="space-y-3">
          <select value={poForm.supplierId} onChange={(e) => setPOForm({ ...poForm, supplierId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg" required>
            <option value="">Select supplier</option>
            {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>

          <select value={poForm.purchaseRequestId} onChange={(e) => setPOForm({ ...poForm, purchaseRequestId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg">
            <option value="">Link to approved request (optional)</option>
            {requests.filter((r) => r.status === 'approved').map((r) => <option key={r._id} value={r._id}>{r.item?.name} — {r.requestedQuantity} {r.item?.unit}</option>)}
          </select>

          <p className="text-sm font-medium">Items</p>
          {poForm.items.map((line, i) => (
            <div key={i} className="grid grid-cols-3 gap-2">
              <select value={line.itemId} onChange={(e) => updatePOItem(i, 'itemId', e.target.value)} className="px-3 py-2 rounded-xl border border-border dark:border-darkBorder bg-white dark:bg-darkBg text-sm" required>
                <option value="">Item</option>
                {items.map((it) => <option key={it._id} value={it._id}>{it.name}</option>)}
              </select>
              <Input placeholder="Qty" type="number" value={line.quantity} onChange={(e) => updatePOItem(i, 'quantity', e.target.value)} required />
              <Input placeholder="Unit cost (₹)" type="number" value={line.unitCost} onChange={(e) => updatePOItem(i, 'unitCost', e.target.value)} required />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addPOItemRow} className="!py-1.5 text-sm">+ Add Item</Button>

          <Button variant="gold" className="w-full">Create Purchase Order</Button>
        </form>
      </Modal>
    </div>
  );
}
