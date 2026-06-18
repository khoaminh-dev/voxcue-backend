const admin = require('../config/firebase-admin');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    // Verify token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Attach user to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      role: decodedToken.role || 'USER' // Assume 'USER' if no custom claim
    };
    
    next();
  } catch (error) {
    console.error('Auth Error:', error);
    return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
  }
};

const requireAdmin = async (req, res, next) => {
  // First ensure they are authenticated
  await requireAuth(req, res, () => {
    if (req.user && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN')) {
      next();
    } else {
      return res.status(403).json({ error: 'Forbidden: Requires admin privileges' });
    }
  });
};

module.exports = {
  requireAuth,
  requireAdmin
};
