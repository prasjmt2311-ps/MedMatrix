const router = require('express').Router();

const {
  createAppointment,
  getMyAppointments,
  getHospitalAppointments
} = require('../controllers/appointmentController');

const {
  protect,
  restrictTo
} = require('../middleware/authMiddleware');


// Patient books appointment
router.post(
  '/',
  protect,
  restrictTo('user'),
  createAppointment
);


// Patient sees own appointments
router.get(
  '/my',
  protect,
  restrictTo('user'),
  getMyAppointments
);


// Hospital sees appointments
router.get(
  '/hospital',
  protect,
  restrictTo('hospital'),
  getHospitalAppointments
);


module.exports = router;