import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const ENCODING = "base64";

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, "base64");

export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  return `${iv.toString(ENCODING)}:${authTag.toString(ENCODING)}:${encrypted}`;
}

export function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== "string") {
    return null;
  }

  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    return null;
  }

  const [ivStr, authTagStr, encryptedData] = parts;

  if (!ivStr || !authTagStr || !encryptedData) {
    return null;
  }

  try {
    const iv = Buffer.from(ivStr, ENCODING);
    const authTag = Buffer.from(authTagStr, ENCODING);

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption Failed:", error.message);
    return null;
  }
}
