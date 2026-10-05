const express = require('express');
const { getPublicRooms, getPublicRoomDetails, getPublicReviews } = require('../controllers/public.controller');

const router = express.Router();

router.get('/rooms', getPublicRooms);
router.get('/rooms/:id', getPublicRoomDetails);
router.get('/reviews', getPublicReviews);

module.exports = router;