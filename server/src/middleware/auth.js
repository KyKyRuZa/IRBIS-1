import jwt from 'jsonwebtoken';

export function cookiesMiddleware(req, res, next) {
  const header = req.headers.cookie;
  req.cookies = {};
  if (!header) return next();
  for (const pair of header.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (key) req.cookies[key] = decodeURIComponent(value);
  }
  next();
}

export function authMiddleware(req, res, next) {
  const cookieToken = req.cookies?.access_token;
  const headerToken = req.headers.authorization?.replace('Bearer ', '');
  const token = cookieToken || headerToken;
  if (!token) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
