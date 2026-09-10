const router = require('express').Router();
const {
    chat,
    translateReport,
    summarizeReport,
    analyzeConsultation
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/chat', chat);
router.post('/translate', translateReport);
router.post('/summarize', summarizeReport);
router.post('/analyze-consultation', analyzeConsultation);  

module.exports = router;