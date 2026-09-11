const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const generatePatientId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'MM-';

  for (let i = 0; i < 7; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return id;
};

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @POST /api/auth/register/user
const registerUser = async (req, res) => {
  try {
    const {
  name,
  email,
  password,
  phone,
  bloodGroup,
  address,
  dateOfBirth,
  gender,
  city,
  state,
  pincode,
  emergencyContact,
  allergies,
  medicalConditions,
  currentMedications,
  previousSurgeries
} = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const patientId = generatePatientId();

const user = await User.create({
  patientId,
  name,
  email,
  password,
  phone,
  bloodGroup,
  address,
  dateOfBirth,
  gender,
  city,
  state,
  pincode,
  emergencyContact,
  allergies,
  medicalConditions,
  currentMedications,
  previousSurgeries,
});
    const token = generateToken(user._id, 'user');

    res.status(201).json({
      token,
      role: 'user',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        bloodGroup: user.bloodGroup,
        patientId: user.patientId,
      },
    });
    } catch (err) {
    console.error('REGISTER USER ERROR:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// @POST /api/auth/register/hospital
const registerHospital = async (req, res) => {
  try {
    const { hospitalName, email, password, phone, address, city, state, pincode, registrationNumber } = req.body;

    if (!hospitalName || !email || !password || !phone || !registrationNumber) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const exists = await Hospital.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const regExists = await Hospital.findOne({ registrationNumber });
    if (regExists) {
      return res.status(409).json({ message: 'Registration number already used' });
    }

    const hospital = await Hospital.create({
      hospitalName, email, password, phone,
      address, city, state, pincode, registrationNumber,
    });

    const token = generateToken(hospital._id, 'hospital');

    res.status(201).json({
      token,
      role: 'hospital',
      user: {
        id: hospital._id,
        name: hospital.hospitalName,
        email: hospital.email,
        city: hospital.city,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Check User first
    let account = await User.findOne({ email });
    let role = 'user';

    // If not found in User, check Hospital
    if (!account) {
      account = await Hospital.findOne({ email });
      role = 'hospital';
    }

    if (!account) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await account.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(account._id, role);

    res.json({
      token,
      role,
      user: {
        id: account._id,
        name: account.name || account.hospitalName,
        email: account.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: req.user, role: req.user.role });
};

module.exports = { registerUser, registerHospital, login, getMe };