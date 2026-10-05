const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permission.middleware');
const c = require('../controllers/attendance.controller');

const router = express.Router();
router.use(protect);

// Shifts: assignment is a "manage" action (Admin/Manager only); everyone else can view their own shifts
router.post('/shifts', requirePermission('attendance', 'manage'), c.assignShift);
router.get('/shifts', requirePermission('attendance', 'manage', 'own'), c.getShifts);
router.delete('/shifts/:id', requirePermission('attendance', 'manage'), c.deleteShift);

router.post('/mark', requirePermission('attendance', 'manage'), c.markAttendance);
router.get('/', requirePermission('attendance', 'manage', 'own'), c.getAttendance);
router.get('/report', requirePermission('attendance', 'manage'), c.getAttendanceReport);

router.post('/leave', requirePermission('attendance', 'manage', 'own'), c.createLeaveRequest);
router.get('/leave', requirePermission('attendance', 'manage', 'own'), c.getLeaveRequests);
router.patch('/leave/:id/approve', requirePermission('attendance', 'manage'), c.approveLeave);
router.patch('/leave/:id/reject', requirePermission('attendance', 'manage'), c.rejectLeave);

module.exports = router;