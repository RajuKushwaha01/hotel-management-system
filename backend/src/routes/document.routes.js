const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const { uploadSingleDocument } = require('../middleware/documentUpload.middleware');
const c = require('../controllers/document.controller');

const router = express.Router();

// Customers never get in. Per-type checks happen in the controller.
router.use(protect, authorize('super_admin', 'hotel_manager', 'receptionist', 'accountant', 'maintenance'));

router.get('/types', c.getTypes);
router.get('/', c.listDocuments);
router.post('/', uploadSingleDocument, c.uploadDocument);
router.get('/:id/file', c.streamFile);
router.get('/:id/access-log', authorize('hotel_manager', 'super_admin'), c.getAccessLog);
router.delete('/:id', authorize('hotel_manager', 'super_admin'), c.deleteDocument);

module.exports = router;