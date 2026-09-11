const User = require('../models/User');

// @GET /api/patients/me
// Get logged-in patient's own profile
const getMyProfile = async (req, res) => {
  try {
    const patient = await User.findById(req.user._id).select('-password');

    if (!patient) {
      return res.status(404).json({
        message: 'Patient not found'
      });
    }

    res.json(patient);

  } catch (err) {
    console.error('GET MY PROFILE ERROR:', err);

    res.status(500).json({
      message: 'Unable to fetch patient profile',
      error: err.message
    });
  }
};


// @GET /api/patients/id/:patientId
// Hospital can search patient using MedMatrix Patient ID
const getPatientById = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await User.findOne({
      patientId
    }).select('-password');

    if (!patient) {
      return res.status(404).json({
        message: 'Patient not found'
      });
    }

    res.json(patient);

  } catch (err) {
    console.error('GET PATIENT BY ID ERROR:', err);

    res.status(500).json({
      message: 'Unable to fetch patient',
      error: err.message
    });
  }
};


module.exports = {
  getMyProfile,
  getPatientById
};