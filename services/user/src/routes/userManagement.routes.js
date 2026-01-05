// src/routes/userManagement.routes.js
import express from "express";
import { authenticateToken } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import {
  listManagedUsers,
  updateManagedUser,
  deleteManagedUser,
} from "../controllers/management.controller.js";

const r = express.Router();

r.use(authenticateToken, requireAdmin);

r.get("/api/user/management", listManagedUsers);
r.patch("/api/user/management/:id", updateManagedUser);
r.delete("/api/user/management/:id", deleteManagedUser);

export default r;

