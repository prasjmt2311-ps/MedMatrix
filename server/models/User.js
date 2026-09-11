const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    patientId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  phone: {
    type: String,
    required: [true, 'Phone is required'],
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    default: 'O+',
  },
  address: { type: String, default: '' },
  role: { type: String, default: 'user' },
    dateOfBirth: {
    type: Date,
    default: null,
  },

  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Other',
  },

  city: {
    type: String,
    default: '',
    trim: true,
  },

  state: {
    type: String,
    default: '',
    trim: true,
  },

  pincode: {
    type: String,
    default: '',
    trim: true,
  },

  emergencyContact: {
    name: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    relationship: {
      type: String,
      default: '',
      trim: true,
    },
  },

  allergies: {
    type: [String],
    default: [],
  },

  medicalConditions: {
    type: [String],
    default: [],
  },

  currentMedications: {
    type: [String],
    default: [],
  },

  previousSurgeries: {
    type: [String],
    default: [],
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);