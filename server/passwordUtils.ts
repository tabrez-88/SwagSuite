import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Validate password strength
 * Returns an error message if invalid, or null if valid
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  
  return null;
}

/**
 * Validate username
 * Returns an error message if invalid, or null if valid
 */
export function validateUsername(username: string): string | null {
  if (username.length < 3) {
    return 'Username must be at least 3 characters long';
  }
  
  if (username.length > 30) {
    return 'Username must be less than 30 characters';
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return 'Username can only contain letters, numbers, hyphens, and underscores';
  }
  
  return null;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }
  
  return null;
}

/**
 * Generate an invitation token that expires in 7 days
 */
export function generateInvitationToken(): {
  token: string;
  expiresAt: Date;
} {
  const token = generateToken(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
  
  return { token, expiresAt };
}

/**
 * Generate a password reset token that expires in 1 hour
 */
export function generatePasswordResetToken(): {
  token: string;
  expiresAt: Date;
} {
  const token = generateToken(32);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry
  
  return { token, expiresAt };
}
