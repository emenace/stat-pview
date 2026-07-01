/**
 * Middleware to require authenticated user session
 */
export function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }
  return res.status(401).json({
    success: false,
    error: 'Unauthorized. Please log in to access this resource.'
  });
}

/**
 * Middleware to optionally attach user session if logged in
 */
export function optionalAuth(req, res, next) {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  return next();
}
