import { Router } from "express";
import multer from "multer";
import { storagePut } from "../storage";
import { randomBytes } from "crypto";

const router = Router();

// Magic bytes for allowed image types (C2, M2, M9)
const IMAGE_MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/jpg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
};

function validateImageMagicBytes(buffer: Buffer, mimetype: string): boolean {
  const signatures = IMAGE_MAGIC_BYTES[mimetype];
  if (!signatures) return false;
  return signatures.some(sig =>
    sig.every((byte, i) => buffer[i] === byte)
  );
}

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// POST /api/upload/image
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // C2/M2/M9: Validate magic bytes to prevent file type spoofing
    if (!validateImageMagicBytes(req.file.buffer, req.file.mimetype)) {
      return res.status(400).json({ error: "Invalid file content: file type mismatch" });
    }

    // Generate unique filename with random suffix to prevent enumeration
    const randomSuffix = randomBytes(8).toString("hex");
    const fileExtension = req.file.originalname.split(".").pop() || "jpg";
    const fileName = `professional-photos/${Date.now()}-${randomSuffix}.${fileExtension}`;

    // Upload to S3
    const { url } = await storagePut(
      fileName,
      req.file.buffer,
      req.file.mimetype
    );

    res.json({ url });
  } catch (error) {
    console.error("[Image Upload] Error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

export default router;
