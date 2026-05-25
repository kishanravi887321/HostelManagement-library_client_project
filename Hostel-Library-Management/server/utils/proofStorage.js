import { put } from "@vercel/blob";
import fs from "fs/promises";
import path from "path";

const localUploadDir = path.resolve(process.cwd(), "uploads");

const ensureLocalUploadDir = async () => {
  await fs.mkdir(localUploadDir, { recursive: true });
};

const isBlobStorageEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const isRemoteProofValue = (value) => /^https?:\/\//i.test(String(value || ""));

const buildStoredFileName = (file) => {
  const originalName = String(file?.originalname || "proof.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${Date.now()}-${originalName}`;
};

export const persistProofFile = async (file) => {
  if (!file) return "";

  const storedFileName = buildStoredFileName(file);
  // If running on Vercel (serverless) require blob token — local disk is unreliable
  if (process.env.VERCEL && !isBlobStorageEnabled()) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set. Configure blob storage in production to enable file uploads.");
  }

  if (isBlobStorageEnabled()) {
    const blob = await put(`proofs/${storedFileName}`, file.buffer, {
      access: "public",
      contentType: file.mimetype || "application/octet-stream",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      allowOverwrite: false,
    });

    return blob.url;
  }

  await ensureLocalUploadDir();
  await fs.writeFile(path.join(localUploadDir, storedFileName), file.buffer);
  return storedFileName;
};

export const deleteProofFile = async (proofValue) => {
  if (!proofValue) return;

  const storedValue = String(proofValue);

  if (isRemoteProofValue(storedValue)) {
    if (!isBlobStorageEnabled()) {
      throw new Error("Blob storage token is required to delete remote proof files");
    }

    const { del } = await import("@vercel/blob");
    await del(storedValue, { token: process.env.BLOB_READ_WRITE_TOKEN });
    return;
  }

  try {
    await fs.unlink(path.join(localUploadDir, storedValue));
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
};