/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { encrypt, decrypt } from "@/lib/encryption";

const ISSUER = "ForThePeople.in";
const LABEL = "Admin";

// Generate a new TOTP secret
export function generateTOTPSecret(): { secret: string; encryptedSecret: string } {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: LABEL,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
  });
  const secret = totp.secret.base32;
  const encryptedSecret = encrypt(secret);
  return { secret, encryptedSecret };
}

// Generate QR code data URL for Google Authenticator
export async function generateQRCode(secret: string): Promise<string> {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: LABEL,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  const uri = totp.toString();
  return await QRCode.toDataURL(uri);
}

// Verify a 6-digit TOTP code
export function verifyTOTP(encryptedSecret: string, token: string): boolean {
  try {
    const secret = decrypt(encryptedSecret);
    const totp = new OTPAuth.TOTP({
      issuer: ISSUER,
      label: LABEL,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    const delta = totp.validate({ token, window: 1 });
    return delta !== null;
  } catch {
    return false;
  }
}

// Generate 8 one-time backup codes
export function generateBackupCodes(): { codes: string[]; encryptedCodes: string } {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const code =
      Math.random().toString(36).substring(2, 6).toUpperCase() +
      "-" +
      Math.random().toString(36).substring(2, 6).toUpperCase();
    codes.push(code);
  }
  const encryptedCodes = encrypt(JSON.stringify(codes));
  return { codes, encryptedCodes };
}

// Verify a backup code and remove it (one-time use)
export function verifyBackupCode(
  encryptedCodes: string,
  inputCode: string
): { valid: boolean; updatedEncryptedCodes: string | null } {
  try {
    const codes: string[] = JSON.parse(decrypt(encryptedCodes));
    const normalizedInput = inputCode.toUpperCase().trim();
    const index = codes.indexOf(normalizedInput);
    if (index === -1) return { valid: false, updatedEncryptedCodes: null };
    codes.splice(index, 1);
    return {
      valid: true,
      updatedEncryptedCodes: codes.length > 0 ? encrypt(JSON.stringify(codes)) : null,
    };
  } catch {
    return { valid: false, updatedEncryptedCodes: null };
  }
}
