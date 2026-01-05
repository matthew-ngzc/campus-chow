// src/controllers/management.controller.js
import { User } from "../models/User.js";
import { Op } from "sequelize";


const toPublic = (u) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  phone: u.phone,
  profile_picture: u.profile_picture,
  coins: u.coins,
  role: u.role,
  created_at: u.created_at,
});

// GET /api/user/management?page=&size=&q=
export const listManagedUsers = async (req, res) => {
  const page = Math.max(0, Number(req.query.page || 0));
  const size = Math.min(100, Math.max(1, Number(req.query.size || 20)));
  const qRaw = (req.query.q || "").trim();

  // normalize input for flexible search
  const q = qRaw.replace(/^#/, "");      // allow "#123"
  const isNumeric = /^[0-9]+$/.test(q);  // simple numeric check (for id)
  const phoneLike = `%${q}%`;

  const orClauses = [
    { email: { [Op.iLike]: `%${q}%` } },
    { name:  { [Op.iLike]: `%${q}%` } },
    { phone: { [Op.iLike]: phoneLike } },
  ];

  // exact id match when q is numeric
  if (isNumeric) {
    orClauses.push({ id: Number(q) });
  }

  const where = q ? { [Op.or]: orClauses } : {};

  const { rows, count } = await User.findAndCountAll({
    where,
    offset: page * size,
    limit: size,
    order: [["id", "ASC"]],
    attributes: ["id", "email", "name", "phone", "profile_picture", "coins", "role", "created_at"],
  });

  res.json({ page, size, total: count, data: rows.map(toPublic) });
};
// PATCH /api/user/management/:id  (name, phone, email, coins)
export const updateManagedUser = async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, coins } = req.body || {};

  const u = await User.findByPk(id);
  if (!u) return res.status(404).json({ error: "not found" });

  if (email !== undefined) {
    const newEmail = String(email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({ error: "invalid email format" });
    }
    const dup = await User.findOne({ where: { email: newEmail } });
    if (dup && String(dup.id) !== String(u.id)) {
      return res.status(409).json({ error: "email already in use" });
    }
    u.email = newEmail;
  }

  if (name !== undefined) u.name = name;
  if (phone !== undefined) u.phone = phone;

  if (coins !== undefined) {
    const n = Number(coins);
    if (!Number.isInteger(n) || n < 0) {
      return res.status(400).json({ error: "coins must be a non-negative integer" });
    }
    u.coins = n;
  }

  await u.save();
  return res.json(toPublic(u));
};

// DELETE /api/user/management/:id
export const deleteManagedUser = async (req, res) => {
  const { id } = req.params;
  const u = await User.findByPk(id);
  if (!u) return res.status(404).json({ error: "not found" });

  await u.destroy();
  return res.status(204).send();
};
