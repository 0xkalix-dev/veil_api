const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

// Public route - no auth required
router.get('/', configController.getConfig);

// Update config (you can add admin auth middleware later)
router.put('/', configController.updateConfig);

module.exports = router;
