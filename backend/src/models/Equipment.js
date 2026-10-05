const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // "Elevator A", "Generator", "AC Unit - Room 204"
    category: { type: String, enum: ['elevator', 'generator', 'hvac', 'boiler', 'fire_safety', 'kitchen_equipment', 'laundry_equipment', 'other'], required: true },
    location: String,
    serialNumber: String,
    installDate: Date,
    lastServiceDate: Date,
    nextServiceDue: Date,
    status: { type: String, enum: ['operational', 'needs_service', 'out_of_order'], default: 'operational' },
    serviceHistory: [{ date: Date, note: String, cost: Number, performedBy: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Equipment', equipmentSchema);