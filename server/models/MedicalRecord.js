const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  patientName: { type: String, required: true },
  transferId: { type: mongoose.Schema.Types.ObjectId, ref: 'TransferRequest', default: null },

  type: {
    type: String,
    enum: ['discharge_summary', 'prescription', 'lab_report', 'insurance', 'imaging', 'vaccination', 'vitals_report', 'referral_letter'],
    required: true,
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  issuedBy: { type: String, default: 'MedMatrix Hospital' },
  issuedDate: { type: Date, default: Date.now },

  // DigiLocker simulation
  digilockerVerified: { type: Boolean, default: false },
  digilockerDocId: { type: String, default: '' }, // e.g. "DL-2024-AB12CD"
  digilockerSyncedAt: { type: Date, default: null },

  // File
  fileUrl: { type: String, default: '' },
  fileType: { type: String, default: 'pdf' }, // pdf, image, etc.

  // Medical metadata
  metadata: {
    diagnosis: { type: String, default: '' },
    medications: [{ type: String }],
    vitals: {
      bp: { type: String, default: '' },
      heartRate: { type: String, default: '' },
      spo2: { type: String, default: '' },
      temperature: { type: String, default: '' },
      respiratoryRate: { type: String, default: '' },
    },
    labValues: {
      hemoglobin: { type: String, default: '' },
      wbc: { type: String, default: '' },
      platelets: { type: String, default: '' },
      creatinine: { type: String, default: '' },
    },
    notes: { type: String, default: '' },
  },
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
