import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, '..', 'public', 'temp'));  // Correct root path
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg", "image/png", "image/gif", // 🖼️ Images
    "application/pdf", // 📄 PDFs
    "video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", // 🎥 Videos (MP4, MPEG, AVI, MOV)
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Invalid file type. Only images (jpeg, png, gif), PDFs, and videos (mp4, mpeg, avi, mov) are allowed"));
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 5, // Max total files: 5
  },
  fileFilter,
});

