const mongoose = require('mongoose');

const nightAuditSchema = new mongoose.Schema(
  {
    businessDate: { type: Date, required: true, unique: true },

    // Step checks
    openBookingsCount: Number,
    unpaidFoliosCount: Number,
    unpaidFoliosAmount: Number,
    roomStatusIssues: [{ room: String, status: String, expected: String }],

    // Calculated figures
    roomRevenue: Number,
    restaurantRevenue: Number,
    totalRevenue: Number,
    taxCollected: Number,
    occupiedRooms: Number,
    totalRooms: Number,
    occupancyRate: Number,
    arrivals: Number,
    departures: Number,
    noShows: Number,

    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
    runBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    closedAt: Date,
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('NightAudit', nightAuditSchema);