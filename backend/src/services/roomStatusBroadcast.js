const { getIO } = require('../socket');

// The single choke point every room-status change passes through. Anywhere in the codebase
// that sets Room.status now calls this too, so the room board updates live for every
// connected staff member without them needing to refresh — closing the one place the
// system had REST-only updates while everything else (KDS, notifications, low-stock) was live.
const broadcastRoomStatus = (room) => {
  try {
    getIO().to('rooms-board').emit('room-status-changed', {
      roomId: room._id,
      roomNumber: room.roomNumber,
      status: room.status,
      updatedAt: new Date(),
    });
  } catch (_) {} // socket not initialized (e.g. in tests) — never block the actual DB write
};

module.exports = { broadcastRoomStatus };