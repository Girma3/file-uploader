import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import crypto from "crypto";

const uploaderDir = path.join(dirname(fileURLToPath(import.meta.url)), "../");
const uploadFiles = path.join(uploaderDir, "files");
const uploadFolders = path.join(uploaderDir, "folders");

const uploadDir = path.join(uploaderDir, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function generateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath); // Read file contents
  const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  return hash;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const filePaths = Array.isArray(req.body.paths)
      ? req.body.paths
      : [req.body.paths];

    const filePath = filePaths.find((p) => p.endsWith(file.originalname));
    const folderPath = filePath
      ? path.join(uploadDir, path.dirname(filePath))
      : uploadDir;

    fs.mkdir(folderPath, { recursive: true }, (err) => {
      if (err) {
        return cb(err);
      }
      cb(null, folderPath); // Set the folder path as the destination
    });
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Temporarily save with the original name
  },
});

// Middleware to rename file with hash after saving
const hashFileNameMiddleware = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []); // Handle both single and multiple files

  if (files.length === 0) {
    return res.status(400).json({ error: "No files were uploaded." });
  }

  try {
    files.forEach((file) => {
      const uploadedFilePath = file.path;

      if (!fs.existsSync(uploadedFilePath)) {
        throw new Error(`File not found: ${uploadedFilePath}`);
      }

      const fileHash = generateFileHash(uploadedFilePath);
      const hashedFileName = `${fileHash}${path.extname(file.originalname)}`;

      const newFilePath = path.join(
        path.dirname(uploadedFilePath),
        hashedFileName
      );

      // Rename the file
      fs.renameSync(uploadedFilePath, newFilePath);
      file.hashedFileName = hashedFileName; // Attach the hashed name to the file object
      const folderName = path.basename(path.dirname(uploadedFilePath)); //attach folder name if there is
      folderName === "uploads"
        ? (file.folderName = "files") //default folder for file that has no folder
        : (file.folderName = folderName);
    });

    next();
  } catch (error) {
    next(error); // Pass errors to the error-handling middleware
  }
};
const upload = multer({ storage: storage });
export { upload, hashFileNameMiddleware };
