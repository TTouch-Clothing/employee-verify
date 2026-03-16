import dotenv from "dotenv";
import { fileURLToPath } from "url";

const envPath = fileURLToPath(new URL("../.env", import.meta.url));


const result = dotenv.config({ path: envPath });

import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";

const PORT = process.env.PORT || 5000;


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