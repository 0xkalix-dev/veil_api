const Contact = require('../models/Contact');

// Submit contact form
exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Email and message are required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address'
      });
    }

    // Get IP address and user agent
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Get wallet address if user is authenticated (optional)
    let walletAddress = null;
    if (req.user && req.user.walletAddress) {
      walletAddress = req.user.walletAddress;
    }

    // Create contact entry
    const contact = new Contact({
      name: name ? name.trim() : '',
      email: email.trim().toLowerCase(),
      subject: subject ? subject.trim() : '',
      message: message.trim(),
      walletAddress,
      ipAddress,
      userAgent,
      status: 'NEW'
    });

    await contact.save();

    console.log('✅ Contact form submitted:', {
      id: contact._id,
      name: contact.name,
      email: contact.email,
      hasWallet: !!walletAddress
    });

    res.json({
      success: true,
      data: {
        message: 'Contact request submitted successfully',
        id: contact._id
      }
    });
  } catch (error) {
    console.error('❌ Submit contact error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit contact request'
    });
  }
};
