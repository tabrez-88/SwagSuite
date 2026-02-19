import { Strategy as LocalStrategy } from "passport-local";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { comparePassword } from "./passwordUtils";
import { pool } from "./db";

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
          let user = await storage.getUserByUsername(username);
          if (!user) {
            user = await storage.getUserByEmail(username);
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

          await storage.updateUserLastLogin(user.id);

          const sessionUser = {
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

          console.log(`Local auth successful for: ${username}`);
          return done(null, sessionUser as any);
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
        await storage.upsertUser({
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

  // POST endpoint for username/password login
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

      req.logIn(user, (err) => {
        if (err) {
          console.error("Session error:", err);
          return res.status(500).json({ message: "Failed to create session" });
        }

        return res.json({
          message: "Login successful",
          user: {
            id: user.claims.sub,
            email: user.claims.email,
            firstName: user.claims.first_name,
            lastName: user.claims.last_name,
          }
        });
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
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
