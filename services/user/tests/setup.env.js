// loads .env.test for the test process
import { config } from "dotenv";
config({ path: ".env.test" });

// Make sure uploads dir exists (multer writes here in your controller)
import fs from "fs";
import path from "path";
const uploadsDir = path.join(process.cwd(), "src", "uploads", "avatars");
fs.mkdirSync(uploadsDir, { recursive: true });

