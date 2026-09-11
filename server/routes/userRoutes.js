const router = require('express').Router();
const { getNearbyDoctors } = require('../overpass');
const { getResources, getProfile, updateProfile, submitFeedback, getAppointments } = require('../controllers/userController');
const { getNearbyHospitals } = require('../controllers/hospitalController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Public route for geolocation lookups
router.get('/nearby-doctors', async (req, res) => {
  try {
    const { lat, lon, radius } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude required' });
    }
    const doctors = await getNearbyDoctors(Number(lat), Number(lon), Number(radius) || 10000);
    res.json({ success: true, doctors });
  } catch (error) {
    console.error('Fetch error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch doctors' });
  }
});

// Protected routes
router.use(protect);
router.use(restrictTo('user'));

router.get('/resources', getResources);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/feedback', submitFeedback);
router.get('/appointments', getAppointments);
router.get('/nearby-hospitals', getNearbyHospitals);

module.exports = router;