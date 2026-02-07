import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import { Strategy as LocalStrategy } from "passport-local";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { comparePassword } from "./passwordUtils";

// Determine if we are in local development mode
// We consider it local dev if REPL_ID is not set or if it is set to "local-dev"
const isLocalDev = !process.env.REPL_ID || process.env.REPL_ID === "local-dev";

// Only enforce REPLIT_DOMAINS if not in local dev
if (!isLocalDev && !process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

import { pool } from "./db";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool, // Use the existing pool with WebSocket configuration
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: !isLocalDev, // Only secure in production
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  // Check if this is the first user (make them admin automatically)
  const { db } = await import("./db");
  const { users } = await import("@shared/schema");
  const { sql } = await import("drizzle-orm");
  
  const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
  const isFirstUser = Number(userCount[0].count) === 0;
  
  // Get default role from environment or use "user" as fallback
  const defaultRole = process.env.DEFAULT_USER_ROLE || "user";
  
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
    role: isFirstUser ? "admin" : defaultRole as "admin" | "manager" | "user", // First user becomes admin, others get default role
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Always set up Local Strategy for username/password login
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

          // Check if user exists
          if (!user) {
            return done(null, false, { message: "Invalid username or password" });
          }

          // Check if user is active
          if (!user.isActive) {
            return done(null, false, { message: "Account is disabled" });
          }

          // Check if user has password (local auth)
          if (!user.password) {
            return done(null, false, { message: "This account uses OAuth login" });
          }

          // Verify password
          const isValidPassword = await comparePassword(password, user.password);
          if (!isValidPassword) {
            return done(null, false, { message: "Invalid username or password" });
          }

          // Update last login
          await storage.updateUserLastLogin(user.id);

          // Create session user object
          const sessionUser = {
            claims: {
              sub: user.id,
              email: user.email,
              first_name: user.firstName,
              last_name: user.lastName,
              profile_image_url: user.profileImageUrl,
              exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
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

  if (isLocalDev) {
    console.log("Setting up Local Auth Strategy for development");

    // Redirect /api/login to landing page in dev mode
    app.get("/api/login", (req, res) => {
      res.redirect("/?auth=required");
    });

    // Development auto-login (for testing)
    app.get("/api/login/dev", (req, res) => {
      req.login(
        {
          claims: {
            sub: "dev-user-id",
            email: "dev@example.com",
            first_name: "Developer",
            last_name: "Local",
            profile_image_url: "https://via.placeholder.com/150",
            exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
          },
          expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
        } as any,
        async (err) => {
          if (err) {
            return res.status(500).send("Login failed");
          }
          await upsertUser({
            sub: "dev-user-id",
            email: "dev@example.com",
            first_name: "Developer",
            last_name: "Local",
            profile_image_url: "https://via.placeholder.com/150",
          });
          return res.redirect("/");
        }
      );
    });
  } else {
    // Original Replit Auth Logic
    const config = await getOidcConfig();

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      const user: any = {};
      updateUserSession(user, tokens);
      await upsertUser(tokens.claims());
      verified(null, user);
    };

    const domains = process.env.REPLIT_DOMAINS!.split(",");
    for (const domain of domains) {
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      console.log(`Registering authentication strategy for domain: ${domain}`);
      passport.use(strategy);
    }

    app.get("/api/login", (req, res, next) => {
      const strategy = `replitauth:${req.hostname}`;
      console.log(`Attempting authentication with strategy: ${strategy}`);
      passport.authenticate(strategy, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });

    app.get("/api/callback", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    });
  }

  // POST endpoint for username/password login (works in all environments)
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
      if (isLocalDev) {
        res.redirect("/");
      } else {
        // Use default config here as we are inside async function not requiring params
        getOidcConfig().then(config => {
           res.redirect(
            client.buildEndSessionUrl(config, {
              client_id: process.env.REPL_ID!,
              post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
            }).href
          );
        });
      }
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  // Check if authenticated
  if (!req.isAuthenticated()) {
     return res.status(401).json({ message: "Unauthorized" });
  }

  // If local dev, skip strict token validation
  if (isLocalDev) {
     return next();
  }

  if (!user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
