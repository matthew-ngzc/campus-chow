import jwt from "jsonwebtoken";

/**
 * Reads Bearer token, verifies HS256 with JWT_SECRET,
 * requires issuer === JWT_ISSUER, then sets req.user = { id, role, sub }.
 */
export const authenticateToken = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const [, token] = auth.split(" ");

  if (!token) return res.status(401).json({ error: "missing token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: process.env.JWT_ISSUER || "auth-service",
    });

    // normalize
    req.user = {
      id: decoded.id || decoded.sub,
      sub: decoded.sub || decoded.id,
      role: decoded.role,
      iss: decoded.iss,
    };

    if (!req.user.id) return res.status(401).json({ error: "invalid token" });
    return next();
  } catch (e) {
    return res.status(401).json({ error: "invalid or expired token" });
  }
};

