const router = require('express').Router();
const {
  createTransfer, getHospitalTransfers, getUserTransfers,
  approveTransfer, rejectTransfer, updateTransferStatus,
  getRecommendations, updateAmbulanceLocation, getTransfer,
  requestInfo, respondToInfoRequest, syncDigilocker, getTransferDocuments,
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
router.get('/:id/documents', getTransferDocuments);
router.put('/:id/approve', restrictTo('hospital'), approveTransfer);
router.put('/:id/reject', restrictTo('hospital'), rejectTransfer);
router.put('/:id/request-info', restrictTo('hospital'), requestInfo);
router.put('/:id/respond-info', respondToInfoRequest);
router.put('/:id/status', updateTransferStatus);
router.put('/:id/ambulance', updateAmbulanceLocation);
router.post('/:id/sync-digilocker', syncDigilocker);

module.exports = router;