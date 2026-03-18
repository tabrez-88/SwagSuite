import crypto from "crypto";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";

const APP_NAME = "SwagSuite";
const BACKUP_CODE_COUNT = 10;
const SALT_ROUNDS = 10;

// --- Encryption for TOTP secrets ---

function getEncryptionKey(): Buffer {
  const key = process.env.TWO_FACTOR_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("TWO_FACTOR_ENCRYPTION_KEY environment variable is required for 2FA");
  }
  // Key should be 32 bytes (64 hex chars) for AES-256
  return Buffer.from(key, "hex");
}

export function encryptSecret(secret: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(secret, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptSecret(encryptedData: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encrypted] = encryptedData.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// --- TOTP ---

export function generateTOTPSecret(): string {
  // Generate a random secret (20 bytes = 160 bits, standard for TOTP)
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

export function createTOTPInstance(secret: string, userEmail: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: APP_NAME,
    label: userEmail,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

export function verifyTOTPCode(secret: string, code: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: APP_NAME,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  // Allow 1 step window (30 seconds before/after)
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

export async function generateQRCodeDataURL(
  secret: string,
  userEmail: string
): Promise<string> {
  const totp = createTOTPInstance(secret, userEmail);
  const uri = totp.toString();
  return await QRCode.toDataURL(uri);
}

// --- Backup Codes ---

export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    // Generate 8-character alphanumeric codes in format: xxxx-xxxx
    const part1 = crypto.randomBytes(2).toString("hex");
    const part2 = crypto.randomBytes(2).toString("hex");
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

export async function hashBackupCodes(
  codes: string[]
): Promise<{ hash: string; used: boolean }[]> {
  const hashed = await Promise.all(
    codes.map(async (code) => ({
      hash: await bcrypt.hash(code.replace("-", ""), SALT_ROUNDS),
      used: false,
    }))
  );
  return hashed;
}

export async function verifyBackupCode(
  code: string,
  hashedCodes: { hash: string; used: boolean }[]
): Promise<{ valid: boolean; updatedCodes: { hash: string; used: boolean }[] }> {
  const normalizedCode = code.replace("-", "");
  for (let i = 0; i < hashedCodes.length; i++) {
    if (hashedCodes[i].used) continue;
    const match = await bcrypt.compare(normalizedCode, hashedCodes[i].hash);
    if (match) {
      const updatedCodes = [...hashedCodes];
      updatedCodes[i] = { ...updatedCodes[i], used: true };
      return { valid: true, updatedCodes };
    }
  }
  return { valid: false, updatedCodes: hashedCodes };
}

// --- Temp Token (short-lived JWT for 2FA step) ---

import jwt from "jsonwebtoken";

const TEMP_TOKEN_EXPIRY = "5m"; // 5 minutes

function getJWTSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is required");
  return secret;
}

export function createTempToken(userId: string): string {
  return jwt.sign({ sub: userId, purpose: "2fa" }, getJWTSecret(), {
    expiresIn: TEMP_TOKEN_EXPIRY,
  });
}

export function verifyTempToken(token: string): { sub: string } | null {
  try {
    const payload = jwt.verify(token, getJWTSecret()) as any;
    if (payload.purpose !== "2fa") return null;
    return { sub: payload.sub };
  } catch {
    return null;
  }
}

// --- Generate encryption key helper (for initial setup) ---

export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex");
}
