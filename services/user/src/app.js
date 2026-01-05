// src/app.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import userManagementRoutes from "./routes/userManagement.routes.js";

const app = express();

// __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// static files (serve uploaded avatars)
// NOTE: keep it relative to project root so it works in dev/CI/Docker
app.use("/uploads", express.static(path.join(process.cwd(), "src", "uploads")));

app.use(express.json());
// health
app.get("/api/user/health", (_req, res) => res.json({ ok: true }));
// routes
app.use(authRoutes);
app.use(userRoutes);
app.use(userManagementRoutes);



export default app;
