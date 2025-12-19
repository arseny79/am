import { Router } from "express";
import multer from "multer";
import { storagePut } from "../storage";
import { randomBytes } from "crypto";

const router = Router();

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
