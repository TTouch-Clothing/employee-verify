import dotenv from "dotenv";
import fs from "fs";
import { fileURLToPath } from "url";

const envPath = fileURLToPath(new URL("../.env", import.meta.url));

//console.log("ENV PATH =", envPath);
//console.log("ENV EXISTS =", fs.existsSync(envPath));

const result = dotenv.config({ path: envPath });
//console.log("DOTENV RESULT =", result.parsed);

//console.log("CLOUDINARY_CLOUD_NAME =", process.env.CLOUDINARY_CLOUD_NAME);
// console.log("CLOUDINARY_API_KEY =", process.env.CLOUDINARY_API_KEY);
// console.log("CLOUDINARY_API_SECRET =", process.env.CLOUDINARY_API_SECRET ? "loaded" : "missing");

// console.log("----------- SMTP DEBUG -----------");
// console.log("SMTP_HOST =", process.env.SMTP_HOST);
// console.log("SMTP_PORT =", process.env.SMTP_PORT);
// console.log("SMTP_SECURE =", process.env.SMTP_SECURE);
// console.log("SMTP_USER =", process.env.SMTP_USER);
// console.log("SMTP_PASS =", process.env.SMTP_PASS ? "loaded" : "missing");
// console.log("MAIL_FROM =", process.env.MAIL_FROM);
// console.log("----------------------------------");

import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";

const PORT = process.env.PORT || 5000;

// console.log("ALLOW_ADMIN_SEED =", process.env.ALLOW_ADMIN_SEED);

try {
  await connectDB(process.env.MONGO_URI);

  const app = createApp();

  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
} catch (error) {
  console.error("❌ Failed to start server");
  console.error("message:", error.message);
  process.exit(1);
}