export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [id, username, role] = decoded.split(':');
    req.user = { id: Number(id), username, role };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
