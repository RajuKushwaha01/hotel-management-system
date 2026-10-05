const mongoose = require('mongoose');

// The single canonical list of every service the hotel offers, across every department.
// ServiceRequest, LaundryRequest, and TransportRequest previously each hardcoded their own
// "type" enum with no shared price list or ownership — this collection is that missing anchor.
const SERVICE_DEPARTMENTS = ['front_desk', 'housekeeping', 'restaurant', 'transport', 'spa', 'events', 'maintenance'];

const serviceCatalogSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // "Airport Pickup", "Extra Bed", "Express Laundry"
    department: { type: String, enum: SERVICE_DEPARTMENTS, required: true },
    linkedRequestType: { type: String }, // matches ServiceRequest.type / TransportRequest.type / LaundryRequest.serviceType when applicable
    description: String,
    price: { type: Number, default: 0 }, // 0 = complimentary
    isChargeable: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceCatalog', serviceCatalogSchema);
module.exports.SERVICE_DEPARTMENTS = SERVICE_DEPARTMENTS;