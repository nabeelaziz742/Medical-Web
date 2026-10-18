import fs from "fs";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  NoSuchKey,
} from "@aws-sdk/client-s3";

// Private bucket (Cloudflare R2 / AWS S3 / MinIO) used when S3_* variables are set.
// Required on Vercel: its local disk is temporary, so files saved there disappear.
const S3_BUCKET = process.env.S3_BUCKET;
const s3Client =
  S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
    ? new S3Client({
        region: process.env.S3_REGION || "auto",
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: Boolean(process.env.S3_ENDPOINT),
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
      })
    : null;

function objectKey(storageKey: string): string {
  return `prescriptions/${path.basename(storageKey)}`;
}

// Private storage directory outside public/
// On Vercel / serverless runtimes, fallback to /tmp to prevent EROFS errors
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const STORAGE_ROOT = isServerless
  ? path.join("/tmp", "private_storage", "prescriptions")
  : path.join(process.cwd(), "private_storage", "prescriptions");

// Ensure directory exists
function ensureStorageDirectory() {
  try {
    if (!fs.existsSync(STORAGE_ROOT)) {
      fs.mkdirSync(STORAGE_ROOT, { recursive: true });
    }
  } catch (err) {
    console.warn("Storage directory check notice:", err);
  }
}

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
}

export function validatePrescriptionFile(file: {
  size: number;
  type: string;
  name: string;
}): string | null {
  if (!file || file.size === 0) {
    return "Please select a valid prescription file to upload.";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "Prescription file size exceeds the 10MB limit. Please upload a smaller file.";
  }

  const normalizedType = file.type.toLowerCase();
  const ext = path.extname(file.name).toLowerCase();

  const isAllowedMime = Boolean(ALLOWED_MIME_TYPES[normalizedType]);
  const isAllowedExt = [".pdf", ".jpg", ".jpeg", ".png", ".webp"].includes(ext);

  if (!isAllowedMime && !isAllowedExt) {
    return "Unsupported file type. Please upload a PDF, JPG, PNG, or WEBP image.";
  }

  return null;
}

export async function savePrescriptionFile(
  buffer: Buffer | Uint8Array,
  originalName: string,
  mimeType: string
): Promise<{
  storageKey: string;
  fileSize: number;
  fileType: string;
  fileName: string;
}> {
  const safeOriginalName = sanitizeFilename(originalName || "prescription");
  const ext = path.extname(safeOriginalName).toLowerCase() || ALLOWED_MIME_TYPES[mimeType] || ".jpg";
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  const storageKey = `rx_${Date.now()}_${randomSuffix}${ext}`;

  if (s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: objectKey(storageKey),
        Body: Buffer.from(buffer),
        ContentType: mimeType || "application/octet-stream",
      })
    );
  } else {
    if (isServerless) {
      // Refuse rather than keep a medical document on disk that will be wiped
      throw new Error(
        "Prescription upload is temporarily unavailable. Please call the store or send your prescription on WhatsApp."
      );
    }
    ensureStorageDirectory();
    await fs.promises.writeFile(path.join(STORAGE_ROOT, storageKey), Buffer.from(buffer));
  }

  return {
    storageKey,
    fileSize: buffer.length,
    fileType: mimeType || "application/octet-stream",
    fileName: safeOriginalName,
  };
}

export async function readPrescriptionFile(storageKey: string): Promise<Buffer | null> {
  if (s3Client) {
    try {
      const res = await s3Client.send(
        new GetObjectCommand({ Bucket: S3_BUCKET, Key: objectKey(storageKey) })
      );
      if (!res.Body) return null;
      return Buffer.from(await res.Body.transformToByteArray());
    } catch (err) {
      if (err instanceof NoSuchKey) return null;
      throw err;
    }
  }

  ensureStorageDirectory();

  // Prevent directory traversal attacks
  const safeKey = path.basename(storageKey);
  const filePath = path.join(STORAGE_ROOT, safeKey);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  return fs.promises.readFile(filePath);
}

export async function deletePrescriptionFile(storageKey: string): Promise<boolean> {
  try {
    if (s3Client) {
      await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: objectKey(storageKey) }));
      return true;
    }
    ensureStorageDirectory();
    const safeKey = path.basename(storageKey);
    const filePath = path.join(STORAGE_ROOT, safeKey);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
  } catch (err) {
    console.warn("Failed to delete storage file:", err);
  }
  return false;
}
