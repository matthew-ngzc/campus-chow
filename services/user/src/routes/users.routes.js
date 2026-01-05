// src/routes/users.routes.js
import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.js";
import { getMe , getUserById, updateMe, uploadAvatarMw, updateAvatar ,updateMyPassword, getUserByEmail} from "../controllers/user.controller.js";

const r = Router();
r.get("/api/users/me", authenticateToken, getMe);
r.get("/api/users/:email", authenticateToken, getUserByEmail);
r.get("/api/users/:id", authenticateToken, getUserById);
r.patch("/api/users/me", authenticateToken, updateMe);
r.post("/api/users/me/avatar", authenticateToken, uploadAvatarMw, updateAvatar);
r.patch("/api/users/me/password", authenticateToken, updateMyPassword);
export default r;
