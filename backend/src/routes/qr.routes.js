const express = require('express');
const { qrLimiter } = require('../middleware/rateLimiter');
const c = require('../controllers/qr.controller');

const router = express.Router();
router.use(qrLimiter); // every route here is public — no protect() — so rate limiting is mandatory

router.get('/menu/:tableId', c.getQRMenu);
router.post('/menu/:tableId/order', c.createQRMenuOrder);
router.get('/order-status/:orderId', c.getOrderStatus);

router.get('/room/:roomNumber', c.getQRRoom);
router.get('/room-service-menu', c.getRoomServiceMenu);
router.post('/room/:roomNumber/housekeeping', c.requestHousekeeping);
router.post('/room/:roomNumber/reception', c.contactReception);
router.post('/room/:roomNumber/room-service', c.orderRoomService);

router.get('/verify-invoice/:code', c.verifyInvoice);

module.exports = router;