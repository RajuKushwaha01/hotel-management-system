const InventoryItem = require('../models/InventoryItem');
const StockTransaction = require('../models/StockTransaction');
const { getIO } = require('../socket');
const { notifyRole } = require('./notify');
const { logAction } = require('../middleware/auditLogger');

/**
 * Deducts a list of {itemId, quantity} from inventory, in one place, used by every
 * module that consumes stock (Restaurant, Housekeeping, Maintenance). This is what
 * makes the "Inventory ──► X" arrows in the workflow diagram real instead of decorative.
 *
 * Silently skips items that can't be found or have insufficient stock (logs a warning)
 * rather than blocking the parent action (a served meal should never fail because of a
 * stock-count mismatch) — but every successful deduction is still recorded and alerted.
 */
const consumeStock = async ({ consumptions, reason, performedBy, req }) => {
  const results = [];

  for (const { itemId, quantity } of consumptions) {
    if (!itemId || !quantity || quantity <= 0) continue;

    const item = await InventoryItem.findById(itemId);
    if (!item) {
      console.warn(`Inventory deduction skipped: item ${itemId} not found`);
      continue;
    }

    const deducted = Math.min(item.currentStock, quantity); // never go negative
    item.currentStock -= deducted;
    await item.save();

    await StockTransaction.create({
      item: item._id, type: 'stock_out', quantity: deducted, reason,
      performedBy, balanceAfter: item.currentStock,
    });

    results.push({ item: item.name, deducted, remaining: item.currentStock, status: item.status });

    if (item.status === 'low_stock' || item.status === 'out_of_stock') {
      try { getIO().to('inventory').emit('low-stock-alert', { itemId: item._id, name: item.name, currentStock: item.currentStock, status: item.status }); } catch (_) {}
      await notifyRole({
        role: 'hotel_manager', type: 'low_inventory', title: 'Low Stock Alert',
        message: `${item.name} is ${item.status === 'out_of_stock' ? 'out of stock' : 'running low'} (${item.currentStock} ${item.unit} left) after ${reason}.`,
        link: '/manager/inventory',
      });
    }
  }

  if (results.length > 0) {
    await logAction({
      action: 'STOCK_CONSUMED', module: 'inventory', req, userId: performedBy,
      description: `${reason}: ${results.map((r) => `${r.item} −${r.deducted}`).join(', ')}`,
      details: { results },
    });
  }

  return results;
};

module.exports = { consumeStock };