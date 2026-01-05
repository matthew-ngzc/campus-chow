// src/routes/auth.routes.js
import { Router } from "express";
import { register, login } from "../controllers/auth.controller.js";

const r = Router();

r.post("/api/user/auth/register", register);
r.post("/api/user/auth/login", login);

export default r;