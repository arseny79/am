import { Router } from "express";
import multer from "multer";
import { storagePut } from "../storage";

const router = Router();

// Configure multer for document uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"));
    }
  },
});

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = req.file.originalname.split(".").pop();
    const fileName = `credentials/${timestamp}-${randomString}.${extension}`;

    // Upload to S3
    const { url } = await storagePut(
      fileName,
      req.file.buffer,
      req.file.mimetype
    );

    res.json({ url });
  } catch (error) {
    console.error("Document upload error:", error);
    res.status(500).json({ error: "Failed to upload document" });
  }
});

export default router;
