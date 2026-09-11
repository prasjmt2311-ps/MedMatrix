const router = require('express').Router();

const {
  getMyProfile,
  getPatientById
} = require('../controllers/patientController');

const {
  protect,
  restrictTo
} = require('../middleware/authMiddleware');


// Patient gets own information
router.get('/me', protect, getMyProfile);


// Hospital searches patient using Patient ID
router.get(
  '/id/:patientId',
  protect,
  restrictTo('hospital'),
  getPatientById
);


module.exports = router;