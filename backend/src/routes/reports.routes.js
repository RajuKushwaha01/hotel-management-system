const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/reports.controller');

const router = express.Router();
router.use(protect);

router.get('/overview', requirePermission('reports'), c.getOverview); // full only (Admin/Manager)
router.get('/hotel', requirePermission('reports'), c.getHotelReport);
router.get('/financial', requirePermission('reports', 'financial'), c.getFinancialReport);       // + Accountant
router.get('/restaurant', requirePermission('reports', 'fnb', 'kitchen'), c.getRestaurantReport); // + F&B/Chef
router.get('/housekeeping', requirePermission('reports', 'own'), c.getHousekeepingReport);        // + Housekeeping
router.get('/maintenance', requirePermission('reports', 'maintenance'), c.getMaintenanceReport);  // + Maintenance
router.get('/inventory', requirePermission('reports'), c.getInventoryReport); // full only

module.exports = router;