const router = require('express').Router();

const {
  createAppointment,
  getMyAppointments,
  getHospitalAppointments,
  updateAppointmentStatus
} = require('../controllers/appointmentController');

const {
  protect,
  restrictTo
} = require('../middleware/authMiddleware');

// Patient books appointment
router.post(
  '/',
  protect,
  restrictTo('user', 'patient'),
  createAppointment
);

// Patient sees own appointments
router.get(
  '/my',
  protect,
  restrictTo('user', 'patient'),
  getMyAppointments
);

// Hospital / Admin sees appointments
router.get(
  '/hospital',
  protect,
  restrictTo('hospital', 'admin', 'hospital_admin', 'doctor'),
  getHospitalAppointments
);

// Hospital / Admin updates appointment status & fee (Changed to PUT to avoid CORS block)
router.put(
  '/:id/status',
  protect,
  updateAppointmentStatus
);

module.exports = router;