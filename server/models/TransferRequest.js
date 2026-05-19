const mongoose = require('mongoose');

const transferRequestSchema = new mongoose.Schema({
  // Patient Info
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  patientName: { type: String, required: true },
  patientAge: { type: Number, default: 0 },
  patientPhone: { type: String, default: '' },
  bloodGroup: { type: String, default: 'O+' },
  medicalCondition: { type: String, required: true },
  medicalSummary: { type: String, default: '' },

  // Hospital Info
  fromHospital: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
    name: { type: String, default: 'Self/Family' },
    city: { type: String, default: '' },
    phone: { type: String, default: '' },
  },
  toHospital: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
    name: { type: String, required: true },
    city: { type: String, default: '' },
    phone: { type: String, default: '' },
  },

  // Transfer Details
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'in-transit', 'completed', 'cancelled'],
    default: 'pending',
  },
  requiresICU: { type: Boolean, default: false },
  requiresAmbulance: { type: Boolean, default: true },
  specialistNeeded: { type: String, default: '' },

  // AI Recommendation
  aiRecommendation: {
    score: { type: Number, default: 0 },
    reasons: [{ type: String }],
    estimatedArrival: { type: String, default: '' },
  },

  // Ambulance Tracking
  ambulance: {
    isAssigned: { type: Boolean, default: false },
    driverName: { type: String, default: '' },
    vehicleNumber: { type: String, default: '' },
    phone: { type: String, default: '' },
    currentLat: { type: Number, default: 0 },
    currentLng: { type: Number, default: 0 },
    eta: { type: String, default: '' },
  },

  // Timeline
  timeline: [{
    status: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: String,
  }],

  // Notes
  hospitalNotes: { type: String, default: '' },
  rejectionReason: { type: String, default: '' },

  // Timestamps
  approvedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('TransferRequest', transferRequestSchema);