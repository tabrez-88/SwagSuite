import { Strategy as LocalStrategy } from "passport-local";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { userRepository } from "../repositories/user.repository";
import { comparePassword } from "../utils/password";
import { pool } from "../db";
import {
  generateTOTPSecret,
  generateQRCodeDataURL,
  verifyTOTPCode,
  encryptSecret,
  decryptSecret,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  createTempToken,
  verifyTempToken,
  generateTrustedDeviceToken,
  createTrustedDevice,
  verifyTrustedDevice,
  cleanExpiredDevices,
  TRUSTED_DEVICE_COOKIE,
  TRUSTED_DEVICE_MAX_AGE,
  type TrustedDevice,
} from "../services/twoFactor.service";

// Simple in-memory rate limiter for 2FA verification
const twoFaAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_2FA_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes

function check2FARate(key: string): boolean {
  const now = Date.now();
  const entry = twoFaAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    twoFaAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= MAX_2FA_ATTEMPTS) return false;
  entry.count++;
  return true;
}

// Clean up stale entries periodically
setInterval(() => {
  const now = Date.now();
  twoFaAttempts.forEach((entry, key) => {
    if (now > entry.resetAt) twoFaAttempts.delete(key);
  });
}, 60 * 1000);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET?.trim()!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? 'strict' : 'lax',
      maxAge: sessionTtl,
    },
  });
}

function buildSessionUser(user: any) {
  return {
    claims: {
      sub: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      profile_image_url: user.profileImageUrl,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    },
    expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Local Strategy for username/password login
  passport.use(
    "local",
    new LocalStrategy(
      { usernameField: "username", passwordField: "password" },
      async (username, password, done) => {
        try {
          console.log(`Local auth attempt for: ${username}`);

          // Try to find user by username or email
          let user = await userRepository.getUserByUsername(username);
          if (!user) {
            user = await userRepository.getUserByEmail(username);
          }

          if (!user) {
            return done(null, false, { message: "Invalid username or password" });
          }

          if (!user.isActive) {
            return done(null, false, { message: "Account is disabled" });
          }

          if (!user.password) {
            return done(null, false, { message: "This account does not have a password set" });
          }

          const isValidPassword = await comparePassword(password, user.password);
          if (!isValidPassword) {
            return done(null, false, { message: "Invalid username or password" });
          }

          // Return the full DB user object — the login handler decides session vs tempToken
          return done(null, user as any);
        } catch (error) {
          console.error("Local auth error:", error);
          return done(error);
        }
      }
    )
  );

  // Redirect /api/login to landing page
  app.get("/api/login", (req, res) => {
    res.redirect("/?auth=required");
  });

  // Dev auto-login (enabled in all environments)
  app.get("/api/login/dev", (req, res) => {
    req.login(
      {
        claims: {
          sub: "dev-user-id",
          email: "dev@example.com",
          first_name: "Developer",
          last_name: "Local",
          profile_image_url: "",
          exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
        },
        expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      } as any,
      async (err) => {
        if (err) {
          return res.status(500).send("Login failed");
        }
        await userRepository.upsertUser({
          id: "dev-user-id",
          email: "dev@example.com",
          firstName: "Developer",
          lastName: "Local",
          profileImageUrl: "",
          role: "admin",
        });
        return res.redirect("/");
      }
    );
  });

  // POST endpoint for username/password login (2FA-aware)
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

      if (!user) {
        return res.status(401).json({
          message: info?.message || "Invalid username or password"
        });
      }

      // Check if 2FA is enabled
      if (user.twoFactorEnabled && user.twoFactorSecret) {
        // Check for trusted device cookie — skip 2FA if valid
        const trustedToken = req.cookies?.[TRUSTED_DEVICE_COOKIE];
        if (trustedToken) {
          const devices = (user.trustedDevices as TrustedDevice[]) || [];
          if (verifyTrustedDevice(trustedToken, devices)) {
            console.log(`Trusted device recognized for: ${user.username || user.email}`);
            // Skip 2FA — fall through to session creation below
          } else {
            // Invalid/expired token — clear it and require 2FA
            res.clearCookie(TRUSTED_DEVICE_COOKIE);
            const tempToken = createTempToken(user.id);
            console.log(`2FA required for user: ${user.username || user.email}`);
            return res.json({ requires2FA: true, tempToken });
          }
        } else {
          // No trusted device cookie — require 2FA
          const tempToken = createTempToken(user.id);
          console.log(`2FA required for user: ${user.username || user.email}`);
          return res.json({ requires2FA: true, tempToken });
        }
      }

      // No 2FA — create session directly
      const sessionUser = buildSessionUser(user);
      req.logIn(sessionUser as any, async (err) => {
        if (err) {
          console.error("Session error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }

        await userRepository.updateUserLastLogin(user.id);
        console.log(`Login successful for: ${user.username || user.email}`);
        return res.json({
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        });
      });
    })(req, res, next);
  });

  // 2FA Verify (second step of login)
  app.post("/api/auth/2fa/verify", async (req, res) => {
    try {
      const { tempToken, code, trustDevice } = req.body;

      if (!tempToken || !code) {
        return res.status(400).json({ message: "Token and code are required" });
      }

      // Verify temp token
      const payload = verifyTempToken(tempToken);
      if (!payload) {
        return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
      }

      // Rate limit check
      if (!check2FARate(payload.sub)) {
        return res.status(429).json({ message: "Too many attempts. Please wait 5 minutes." });
      }

      const user = await userRepository.getUser(payload.sub);
      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        return res.status(401).json({ message: "Invalid authentication state" });
      }

      const secret = decryptSecret(user.twoFactorSecret);
      let isValid = false;

      // Try TOTP code first
      if (/^\d{6}$/.test(code)) {
        isValid = verifyTOTPCode(secret, code);
      }

      // If not a valid TOTP, try backup code
      if (!isValid && user.twoFactorBackupCodes) {
        const backupCodes = user.twoFactorBackupCodes as { hash: string; used: boolean }[];
        const result = await verifyBackupCode(code, backupCodes);
        if (result.valid) {
          isValid = true;
          await userRepository.setTwoFactorBackupCodes(user.id, result.updatedCodes);
        }
      }

      if (!isValid) {
        return res.status(401).json({ message: "Invalid verification code" });
      }

      // Create session
      const sessionUser = buildSessionUser(user);
      req.logIn(sessionUser as any, async (err) => {
        if (err) {
          console.error("Session error after 2FA:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }

        await userRepository.updateUserLastLogin(user.id);

        // Set trusted device cookie if requested
        if (trustDevice) {
          const deviceToken = generateTrustedDeviceToken();
          const userAgent = req.headers["user-agent"] || "";
          const device = createTrustedDevice(deviceToken, userAgent);
          const existingDevices = cleanExpiredDevices(
            (user.trustedDevices as TrustedDevice[]) || []
          );
          // Keep max 5 trusted devices
          const updatedDevices = [...existingDevices, device].slice(-5);
          await userRepository.setTrustedDevices(user.id, updatedDevices);
          res.cookie(TRUSTED_DEVICE_COOKIE, deviceToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            maxAge: TRUSTED_DEVICE_MAX_AGE,
            path: "/",
          });
          console.log(`Trusted device saved for: ${user.username || user.email}`);
        }

        console.log(`2FA login successful for: ${user.username || user.email}`);
        return res.json({
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        });
      });
    } catch (error) {
      console.error("2FA verify error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // 2FA Setup — Generate secret + QR code (authenticated)
  app.post("/api/auth/2fa/setup", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await userRepository.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.twoFactorEnabled) {
        return res.status(400).json({ message: "2FA is already enabled" });
      }

      // Generate new secret
      const secret = generateTOTPSecret();
      const qrCodeDataUrl = await generateQRCodeDataURL(secret, user.email || user.username || "user");

      // Store encrypted secret (not yet enabled — pending verification)
      const encrypted = encryptSecret(secret);
      await userRepository.setTwoFactorSecret(userId, encrypted);

      return res.json({
        secret, // Show to user for manual entry
        qrCode: qrCodeDataUrl,
      });
    } catch (error) {
      console.error("2FA setup error:", error);
      return res.status(500).json({ message: "Failed to setup 2FA" });
    }
  });

  // 2FA Verify Setup — Confirm with first code, then enable
  app.post("/api/auth/2fa/verify-setup", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { code } = req.body;

      if (!code) return res.status(400).json({ message: "Verification code is required" });

      const user = await userRepository.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.twoFactorEnabled) {
        return res.status(400).json({ message: "2FA is already enabled" });
      }

      if (!user.twoFactorSecret) {
        return res.status(400).json({ message: "No 2FA setup in progress. Start setup first." });
      }

      // Verify the code
      const secret = decryptSecret(user.twoFactorSecret);
      const isValid = verifyTOTPCode(secret, code);

      if (!isValid) {
        return res.status(400).json({ message: "Invalid verification code. Please try again." });
      }

      // Generate backup codes
      const backupCodes = generateBackupCodes();
      const hashedCodes = await hashBackupCodes(backupCodes);

      // Enable 2FA
      await userRepository.enableTwoFactor(userId);
      await userRepository.setTwoFactorBackupCodes(userId, hashedCodes);

      return res.json({
        message: "2FA enabled successfully",
        backupCodes, // Show ONCE to user for saving
      });
    } catch (error) {
      console.error("2FA verify-setup error:", error);
      return res.status(500).json({ message: "Failed to verify 2FA setup" });
    }
  });

  // 2FA Disable
  app.post("/api/auth/2fa/disable", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { password } = req.body;

      if (!password) return res.status(400).json({ message: "Password is required to disable 2FA" });

      const user = await userRepository.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (!user.twoFactorEnabled) {
        return res.status(400).json({ message: "2FA is not enabled" });
      }

      // Verify password
      if (!user.password) return res.status(400).json({ message: "No password set" });
      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        return res.status(403).json({ message: "Invalid password" });
      }

      await userRepository.disableTwoFactor(userId);

      return res.json({ message: "2FA has been disabled" });
    } catch (error) {
      console.error("2FA disable error:", error);
      return res.status(500).json({ message: "Failed to disable 2FA" });
    }
  });

  // 2FA Regenerate Backup Codes
  app.post("/api/auth/2fa/backup-codes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { password } = req.body;

      if (!password) return res.status(400).json({ message: "Password is required" });

      const user = await userRepository.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (!user.twoFactorEnabled) {
        return res.status(400).json({ message: "2FA is not enabled" });
      }

      // Verify password
      if (!user.password) return res.status(400).json({ message: "No password set" });
      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        return res.status(403).json({ message: "Invalid password" });
      }

      const backupCodes = generateBackupCodes();
      const hashedCodes = await hashBackupCodes(backupCodes);
      await userRepository.setTwoFactorBackupCodes(userId, hashedCodes);

      return res.json({
        message: "New backup codes generated",
        backupCodes,
      });
    } catch (error) {
      console.error("2FA backup codes error:", error);
      return res.status(500).json({ message: "Failed to generate backup codes" });
    }
  });

  // 2FA Status (check if current user has 2FA enabled)
  app.get("/api/auth/2fa/status", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await userRepository.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      return res.json({
        enabled: !!user.twoFactorEnabled,
      });
    } catch (error) {
      console.error("2FA status error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/logout", (req, res) => {
    // Note: Do NOT clear TRUSTED_DEVICE_COOKIE here.
    // "Trust this device for 30 days" should persist across logout/login cycles,
    // same as Google/GitHub behavior. Cookie expires naturally after 30 days.
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  // Session expired
  return res.status(401).json({ message: "Unauthorized" });
};
