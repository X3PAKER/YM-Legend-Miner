import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// cho phép Vercel phục vụ file tĩnh
app.use(express.static(path.join(__dirname, "public")));

// route chính trả về index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// chạy local
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// xuất app cho Vercel
export default app;
