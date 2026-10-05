const Supplier = require('../models/Supplier');
const PurchaseRequest = require('../models/PurchaseRequest');
const PurchaseOrder = require('../models/PurchaseOrder');
const InventoryItem = require('../models/InventoryItem');
const StockTransaction = require('../models/StockTransaction');
const ApiError = require('../utils/ApiError');

// ---------- SUPPLIERS ----------
const getSuppliers = async (req, res, next) => {
  try {
    const suppliers = await Supplier.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    next(error);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);
    res.status(201).json({ success: true, message: 'Supplier added', data: supplier });
  } catch (error) {
    next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) throw new ApiError(404, 'Supplier not found');
    res.status(200).json({ success: true, message: 'Supplier updated', data: supplier });
  } catch (error) {
    next(error);
  }
};

const getSupplierPurchaseHistory = async (req, res, next) => {
  try {
    const orders = await PurchaseOrder.find({ supplier: req.params.id }).populate('items.item', 'name unit').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// ---------- PURCHASE REQUESTS (Step 1-2: Low Stock → Request → Manager Approval) ----------
const getPurchaseRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const requests = await PurchaseRequest.find(filter)
      .populate('item', 'name unit currentStock minimumStock department')
      .populate('requestedBy', 'firstName lastName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

const createPurchaseRequest = async (req, res, next) => {
  try {
    const { itemId, requestedQuantity, reason } = req.body;
    const request = await PurchaseRequest.create({
      item: itemId, requestedQuantity, reason, requestedBy: req.user._id,
    });
    const populated = await request.populate('item', 'name unit');
    res.status(201).json({ success: true, message: 'Purchase request submitted', data: populated });
  } catch (error) {
    next(error);
  }
};

const approvePurchaseRequest = async (req, res, next) => {
  try {
    const request = await PurchaseRequest.findById(req.params.id);
    if (!request) throw new ApiError(404, 'Request not found');

    request.status = 'approved';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    await request.save();

    res.status(200).json({ success: true, message: 'Request approved', data: request });
  } catch (error) {
    next(error);
  }
};

const rejectPurchaseRequest = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    const request = await PurchaseRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason, approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );
    if (!request) throw new ApiError(404, 'Request not found');

    res.status(200).json({ success: true, message: 'Request rejected', data: request });
  } catch (error) {
    next(error);
  }
};

// ---------- PURCHASE ORDERS (Step 3-4: PO → Supplier) ----------
const createPurchaseOrder = async (req, res, next) => {
  try {
    const { supplierId, purchaseRequestId, items } = req.body; // items: [{ itemId, quantity, unitCost }]

    if (purchaseRequestId) {
      const request = await PurchaseRequest.findById(purchaseRequestId);
      if (!request || request.status !== 'approved') throw new ApiError(400, 'Purchase request must be approved before creating a PO');
    }

    const poNumber = `PO-${Date.now().toString().slice(-8)}`;
    const po = new PurchaseOrder({
      poNumber,
      supplier: supplierId,
      purchaseRequest: purchaseRequestId,
      items: items.map((i) => ({ item: i.itemId, quantity: i.quantity, unitCost: i.unitCost })),
      createdBy: req.user._id,
    });
    po.calculateTotal();
    await po.save();

    if (purchaseRequestId) {
      await PurchaseRequest.findByIdAndUpdate(purchaseRequestId, { status: 'converted_to_po' });
    }

    const populated = await po.populate([{ path: 'supplier', select: 'name phone' }, { path: 'items.item', select: 'name unit' }]);
    res.status(201).json({ success: true, message: 'Purchase order created', data: populated });
  } catch (error) {
    next(error);
  }
};

const getPurchaseOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const orders = await PurchaseOrder.find(filter)
      .populate('supplier', 'name phone')
      .populate('items.item', 'name unit')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const sendPOToSupplier = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status: 'sent_to_supplier' }, { new: true });
    if (!po) throw new ApiError(404, 'Purchase order not found');
    res.status(200).json({ success: true, message: 'PO marked as sent to supplier', data: po });
  } catch (error) {
    next(error);
  }
};

// ---------- GOODS RECEIVED (Step 5-6: Goods Received → Inventory Updated) ----------
const receiveGoods = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id).populate('items.item');
    if (!po) throw new ApiError(404, 'Purchase order not found');
    if (po.status === 'goods_received' || po.status === 'closed') throw new ApiError(400, 'Goods already received for this order');

    // Update inventory stock for every item in the PO
    for (const line of po.items) {
      const item = await InventoryItem.findById(line.item._id);
      item.currentStock += line.quantity;
      item.costPerUnit = line.unitCost;
      await item.save();

      await StockTransaction.create({
        item: item._id, type: 'stock_in', quantity: line.quantity,
        reason: `Goods received — PO ${po.poNumber}`,
        performedBy: req.user._id, balanceAfter: item.currentStock,
      });
    }

    po.status = 'goods_received';
    po.goodsReceivedAt = new Date();
    po.goodsReceivedBy = req.user._id;
    await po.save();

    res.status(200).json({ success: true, message: 'Goods received and inventory updated', data: po });
  } catch (error) {
    next(error);
  }
};

const closePurchaseOrder = async (req, res, next) => {
  try {
    const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, { status: 'closed' }, { new: true });
    if (!po) throw new ApiError(404, 'Purchase order not found');
    res.status(200).json({ success: true, message: 'Purchase order closed', data: po });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuppliers, createSupplier, updateSupplier, getSupplierPurchaseHistory,
  getPurchaseRequests, createPurchaseRequest, approvePurchaseRequest, rejectPurchaseRequest,
  createPurchaseOrder, getPurchaseOrders, sendPOToSupplier, receiveGoods, closePurchaseOrder,
};