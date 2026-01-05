import { User } from "../models/User.js";
import { Op } from "sequelize";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// ===== multer setup (save to /src/uploads/avatars) =====
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, "..", "uploads", "avatars")),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname || "") || ".jpg").toLowerCase();
    const base = `u${req.user?.id || "x"}_${Date.now()}`;
    cb(null, base + ext);
  },
});

export const uploadAvatarMw = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
}).single("avatar");

// ===== handlers =====

/**
 * POST /api/users/me/avatar
 * form-data: avatar: <file>
 * stores relative path in DB (e.g., "/uploads/avatars/xxx.png")
 */
export const updateAvatar = async (req, res) => {
  const meId = req.user?.id;
  if (!meId) return res.status(401).json({ error: "unauthorized" });
  if (!req.file) return res.status(400).json({ error: "missing file" });

  // Keep it relative so frontend can prefix API_BASE
  const relPath = `/uploads/avatars/${req.file.filename}`;

  const u = await User.findByPk(meId);
  if (!u) return res.status(404).json({ error: "not found" });

  u.profile_picture = relPath; // store relative URL
  await u.save();

  return res.json({ profile_picture: relPath });
};

/**
 * GET /api/users/me
 */
export const getMe = async (req, res) => {
  const meId = req.user?.id;
  if (!meId) return res.status(401).json({ error: "unauthorized" });

  const u = await User.findByPk(meId);
  if (!u) return res.status(404).json({ error: "not found" });

  res.json(toPublic(u));
};

/**
 * GET /api/users/:id
 * return a single user profile (no password fields)
 */
export const getUserById = async (req, res) => {
  const u = await User.findByPk(req.params.id);
  if (!u) return res.status(404).json({ error: "not found" });
  res.json(toPublic(u));
};

/**
 * GET /api/users/:email
 * return a single user profile (no password fields)
 */
export const getUserByEmail = async (req, res) => {
  try {
    const email = req.params.email; 
    const u = await User.findOne({ where: { email } }); 

    if (!u) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(toPublic(u)); 
  } catch (err) {
    console.error("Failed to fetch user by email:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * PATCH /api/users/me
 * body: { name?, phone?, email? }
 * only self-update of basic fields; email dedupe + simple format check
 */
export const updateMe = async (req, res) => {
  const { name, phone, email } = req.body || {};
  const meId = req.user?.id; // set by authenticateToken middleware

  if (!meId) return res.status(401).json({ error: "unauthorized" });

  const u = await User.findByPk(meId);
  if (!u) return res.status(404).json({ error: "not found" });

  if (email !== undefined) {
    const newEmail = String(email).toLowerCase().trim();
    // basic email pattern
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({ error: "invalid email format" });
    }
    // check duplication with another user
    const dup = await User.findOne({ where: { email: newEmail } });
    if (dup && dup.id !== u.id) {
      return res.status(409).json({ error: "email already in use" });
    }
    u.email = newEmail;
  }

  if (name !== undefined) u.name = name;
  if (phone !== undefined) u.phone = phone;

  await u.save();
  res.json(toPublic(u));
};

/**
 * PATCH /api/users/me/password
 * body: { currentPassword, newPassword }
 */

export const updateMyPassword = async (req, res) => {
  const meId = req.user?.id
  if (!meId) return res.status(401).json({ error: 'unauthorized' })

  const { currentPassword, newPassword } = req.body || {}
  if (!currentPassword || !newPassword)
    return res.status(400).json({ error: 'missing fields' })
  if (String(newPassword).length < 8)
    return res.status(400).json({ error: 'password too short (min 8)' })

  const u = await User.findByPk(meId)
  if (!u) return res.status(404).json({ error: 'not found' })

  const stored = u.hashed_password
  if (!stored) return res.status(400).json({ error: 'no stored password' })

  const ok = await bcrypt.compare(currentPassword, stored)
  if (!ok) return res.status(400).json({ error: 'current password incorrect' })

  u.hashed_password = await bcrypt.hash(newPassword, 10)
  await u.save()

  return res.json({ success: true })
}



