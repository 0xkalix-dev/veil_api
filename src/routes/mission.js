const express = require('express');
const router = express.Router();
const missionController = require('../controllers/missionController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.get('/stats', missionController.getMissionStats);

// Routes requiring authentication
router.get('/', authMiddleware, missionController.getMissions);
router.get('/my', authMiddleware, missionController.getMyMissions);
router.get('/:id', authMiddleware, missionController.getMissionById);
router.get('/:id/participation', authMiddleware, missionController.getMissionParticipation);
router.post('/:id/start', authMiddleware, missionController.startMission);
router.post('/:id/follow-attempt', authMiddleware, missionController.recordFollowAttempt);
router.post('/:id/submit', authMiddleware, missionController.submitMission);
router.post('/:id/submit-quiz', authMiddleware, missionController.submitQuiz);
router.post('/:id/claim', authMiddleware, missionController.claimRewards);

// Admin routes (TODO: add admin middleware)
router.post('/', authMiddleware, missionController.createMission);
router.put('/:id', authMiddleware, missionController.updateMission);
router.delete('/:id', authMiddleware, missionController.deleteMission);

module.exports = router;
