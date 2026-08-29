const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const parts = header.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token required'
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret || secret.length < 32) {
      console.error('JWT_SECRET is missing or too short');
      return res.status(500).json({
        success: false,
        message: 'Server authentication is not configured'
      });
    }

    const decoded = jwt.verify(parts[1], secret, {
      issuer: 'batzo-api'
    });

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token'
    });
  }
}

module.exports = { authenticateToken };
