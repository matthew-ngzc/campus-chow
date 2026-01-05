// src/middlewares/requireAdmin.js
export const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "unauthorized" });
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "forbidden" });
  next();
};
