/**
 * Middleware to restrict access strictly to users with 'admin' role
 */
export function adminOnly(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    req.user = req.session.user;
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'Forbidden. Administrator privileges required to perform this action.'
  });
}
