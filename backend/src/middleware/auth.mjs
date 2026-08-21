import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.role) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const authMiddleware = requireAuth;

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: admin only' });
  }
  next();
};

/** @deprecated alias for copied controllers */
export const wasteBankAdminOnly = adminOnly;

export const nasabahOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'nasabah') {
    return res.status(403).json({ message: 'Forbidden: nasabah only' });
  }
  next();
};
