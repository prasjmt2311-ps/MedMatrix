const Appointment = require('../models/Appointment');
const User = require('../models/User');

// @POST /api/appointments
const createAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      doctorName,
      specialty,
      hospitalName,
      date,
      time,
      fee,
      reason
    } = req.body;

    if (!doctorName || !specialty || !date || !time) {
      return res.status(400).json({
        message: 'Doctor, specialty, date and time are required'
      });
    }

    // Get logged-in patient from database
    const patient = await User.findById(req.user._id);

    if (!patient) {
      return res.status(404).json({
        message: 'Patient not found'
      });
    }

    const appointment = await Appointment.create({
      patient: patient._id,
      patientId: patient.patientId,
      doctorId: doctorId || null,
      doctorName,
      specialty,
      hospitalName,
      date,
      time,
      fee: Number(fee) || 0,
      reason
    });

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });

  } catch (err) {
    console.error('CREATE APPOINTMENT ERROR:', err);

    res.status(500).json({
      message: 'Unable to create appointment',
      error: err.message
    });
  }
};

// @GET /api/appointments/my
const getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.user._id
    }).sort({ date: 1 });

    res.json(appointments);

  } catch (err) {
    console.error('GET APPOINTMENTS ERROR:', err);

    res.status(500).json({
      message: 'Unable to fetch appointments',
      error: err.message
    });
  }
};

// @GET /api/appointments/hospital
const getHospitalAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient', 'name patientId phone bloodGroup')
      .sort({ date: 1 });

    res.json(appointments);

  } catch (err) {
    console.error('GET HOSPITAL APPOINTMENTS ERROR:', err);

    res.status(500).json({
      message: 'Unable to fetch hospital appointments',
      error: err.message
    });
  }
};

// @PATCH /api/appointments/:id/status
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, fee } = req.body;

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const updateFields = {};
    if (status) updateFields.status = status;
    if (fee !== undefined && fee !== null && fee !== '') {
      updateFields.fee = Number(fee);
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({
      message: 'Appointment updated successfully',
      appointment
    });

  } catch (err) {
    console.error('UPDATE APPOINTMENT STATUS ERROR:', err);
    res.status(500).json({
      message: 'Unable to update appointment status',
      error: err.message
    });
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getHospitalAppointments,
  updateAppointmentStatus
};