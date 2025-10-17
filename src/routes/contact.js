const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Contact routes - no authentication required
// Submit contact form
router.post('/submit', contactController.submitContact);

module.exports = router;
