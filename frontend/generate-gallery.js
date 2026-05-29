import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const galleryDir = path.join(__dirname, "public", "gallery");
const outputFile = path.join(galleryDir, "gallery.json");

const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".mp4",
  ".mov",
  ".webm",
]);

try {
  if (!fs.existsSync(galleryDir)) {
    console.error("Gallery folder not found:", galleryDir);
    process.exit(1);
  }

  const files = fs
    .readdirSync(galleryDir)
    .filter((file) => {
      const fullPath = path.join(galleryDir, file);
      const ext = path.extname(file).toLowerCase();
      return fs.statSync(fullPath).isFile() && allowedExtensions.has(ext);
    })
    .sort((a, b) => a.localeCompare(b));

  fs.writeFileSync(outputFile, JSON.stringify(files, null, 2));

  console.log(`✅ gallery.json created with ${files.length} files`);
} catch (error) {
  console.error("❌ Error generating gallery.json:", error);
}