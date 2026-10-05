const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/room.controller');

const router = express.Router();
router.use(protect);

router.get('/overview', requirePermission('rooms', 'operational', 'status', 'view', 'maintenance'), c.getRoomOverview);
router.get('/', requirePermission('rooms', 'operational', 'status', 'view', 'maintenance'), c.getAllRooms);
router.get('/:id', requirePermission('rooms', 'operational', 'status', 'view', 'maintenance'), c.getRoomById);

router.post('/', requirePermission('rooms'), c.createRoom);      // full only (Admin/Manager)
router.put('/:id', requirePermission('rooms'), c.updateRoom);    // full only
router.delete('/:id', requirePermission('rooms'), c.deleteRoom); // full only

// Reception (operational) and Housekeeping (status) may both change status — nothing else
router.patch('/:id/status', requirePermission('rooms', 'operational', 'status'), c.updateRoomStatus);

module.exports = router;