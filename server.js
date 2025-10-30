import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Cho phép đọc file tĩnh trong thư mục public
app.use(express.static(path.join(__dirname, "public")));

// Route chính trả về index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Xuất app cho Vercel dùng
export default app;
