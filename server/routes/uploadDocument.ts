import { Router } from "express";
import multer from "multer";
import { storagePut } from "../storage";
import { sdk } from "../_core/sdk";
import { randomUUID } from "crypto";

const router = Router();

// Magic bytes for allowed file types
const MAGIC_BYTES: Record<string, number[][]> = {
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/jpg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
};

function validateMagicBytes(buffer: Buffer, mimetype: string): boolean {
  const signatures = MAGIC_BYTES[mimetype];
  if (!signatures) return false;
  return signatures.some(sig =>
    sig.every((byte, i) => buffer[i] === byte)
  );
}

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

// C1: Require authentication before document upload
router.post("/", async (req, res, next) => {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  } catch {
    return res.status(401).json({ error: "Authentication required" });
  }
}, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // C1/M6: Validate magic bytes to prevent file type spoofing
    if (!validateMagicBytes(req.file.buffer, req.file.mimetype)) {
      return res.status(400).json({ error: "Invalid file content: file type mismatch" });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = randomUUID().replace(/-/g, "").substring(0, 7);
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
