const crypto = require('crypto');
const JWT_SECRET = process.env.JWT_SECRET || 'nexora_super_secure_jwt_secret_key_2026_india';

function generateToken(payload) {
  try {
    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
  } catch (e) {
    // Zero-dependency fallback token
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + (7 * 86400) })).toString('base64url');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
  }
}

function verifyToken(token) {
  try {
    const jwt = require('jsonwebtoken');
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    // Fallback verification
    try {
      const [header, body, signature] = token.split('.');
      const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
      if (signature !== expectedSig) return null;
      const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
      if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
      return data;
    } catch (err) {
      return null;
    }
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No authorization token provided.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid token format. Expected Bearer <token>' });
  }

  const decoded = verifyToken(parts[1]);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired authorization token.' });
  }

  req.user = decoded;
  next();
}

function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (decoded) req.user = decoded;
  }
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  optionalAuthMiddleware
};
