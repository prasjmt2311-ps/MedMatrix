const router = require('express').Router();
const {
  createTransfer, getHospitalTransfers, getUserTransfers,
  approveTransfer, rejectTransfer, updateTransferStatus,
  getRecommendations, updateAmbulanceLocation, getTransfer,
} = require('../controllers/transferController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Public
router.get('/recommendations', getRecommendations);

// Protected
router.use(protect);

router.post('/create', createTransfer);
router.get('/user', restrictTo('user'), getUserTransfers);
router.get('/hospital', restrictTo('hospital'), getHospitalTransfers);
router.get('/:id', getTransfer);
router.put('/:id/approve', restrictTo('hospital'), approveTransfer);
router.put('/:id/reject', restrictTo('hospital'), rejectTransfer);
router.put('/:id/status', updateTransferStatus);
router.put('/:id/ambulance', updateAmbulanceLocation);

module.exports = router;