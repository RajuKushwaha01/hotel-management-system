const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    department: {
      type: String,
      enum: ['front_office', 'housekeeping', 'fnb', 'kitchen', 'accounts', 'maintenance', 'administration'],
      required: true,
    },
    designation: String, // e.g. "Senior Receptionist", "Head Chef"
    joiningDate: { type: Date, required: true },
    employmentStatus: { type: String, enum: ['active', 'on_leave', 'suspended', 'terminated'], default: 'active' },
    documents: [{ name: String, url: String, uploadedAt: { type: Date, default: Date.now } }], // ID proof, contract, certificates
    emergencyContact: { name: String, relation: String, phone: String },
    salary: { type: Number },
    address: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Staff', staffSchema);