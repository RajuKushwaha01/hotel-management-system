const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/event.controller');

const router = express.Router();
router.use(protect);

router.get('/halls', requirePermission('events', 'create', 'support', 'billing'), c.getHalls);
router.post('/halls', requirePermission('events'), c.createHall);   // full only
router.put('/halls/:id', requirePermission('events'), c.updateHall);
router.get('/halls/availability', requirePermission('events', 'create', 'support', 'billing'), c.checkHallAvailability);

router.get('/', requirePermission('events', 'create', 'support', 'billing'), c.getEventBookings);
router.post('/', requirePermission('events', 'create'), c.createEventBooking); // Reception may create
router.put('/:id', requirePermission('events'), c.updateEventBooking);          // full only

// Billing on an event = Accountant's 'billing' level
router.patch('/:id/advance-payment', requirePermission('events', 'billing'), c.collectEventAdvance);
router.get('/:id/invoice', requirePermission('events', 'billing'), c.getEventInvoice);

router.patch('/:id/status', requirePermission('events'), c.updateEventStatus); // full only
module.exports = router;