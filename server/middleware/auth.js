import User from '../models/User.js';

/**
 * Authentication middleware
 * Extracts device ID from X-Device-ID header and attaches user to request
 */
export async function authenticate(req, res, next) {
  try {
    const deviceId = req.headers['x-device-id'];

    if (!deviceId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'X-Device-ID header is missing',
      });
    }

    const user = await User.findOne({ deviceId });

    if (!user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Device not registered. Please register first.',
      });
    }

    // Attach user to request
    req.user = user;
    req.deviceId = deviceId;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'An error occurred during authentication',
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user to request if device ID is provided, but doesn't require it
 */
export async function optionalAuth(req, res, next) {
  try {
    const deviceId = req.headers['x-device-id'];

    if (deviceId) {
      const user = await User.findOne({ deviceId });
      if (user) {
        req.user = user;
        req.deviceId = deviceId;
      }
    }

    next();
  } catch (error) {
    // Continue without auth on error
    next();
  }
}
