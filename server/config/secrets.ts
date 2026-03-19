import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

// All secrets to fetch from GCP Secret Manager
const SECRET_NAMES = [
  "DATABASE_URL",
  "SESSION_SECRET",
  "JWT_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "CLOUDINARY_URL",
  "SAGE_ACCT_ID",
  "SAGE_LOGIN_ID",
  "SAGE_API_KEY",
  "SLACK_BOT_TOKEN",
  "SLACK_CHANNEL_ID",
  "EMAIL_PASSWORD",
  "SS_ACTIVEWEAR_ACCOUNT",
  "SS_ACTIVEWEAR_API_KEY",
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "QB_CLIENT_ID",
  "QB_CLIENT_SECRET",
  "QB_REDIRECT_URI",
  "TAXJAR_API_KEY",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "GEOAPIFY_API_KEY",
  "HUBSPOT_API_KEY",
];

/**
 * Load secrets from GCP Secret Manager into process.env.
 * Only runs in production (Cloud Run). In development, .env file is used via dotenv.
 *
 * Cloud Run service account must have "Secret Manager Secret Accessor" role.
 */
export async function loadSecrets(): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    console.log("Development mode — using .env file, skipping Secret Manager");
    return;
  }

  // GCP_PROJECT_ID can be set as env var, or auto-detected in Cloud Run
  const projectId =
    process.env.GCP_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT;

  if (!projectId) {
    console.warn(
      "No GCP project ID found (GCP_PROJECT_ID / GOOGLE_CLOUD_PROJECT). Skipping Secret Manager."
    );
    return;
  }

  const client = new SecretManagerServiceClient();
  let loaded = 0;
  let skipped = 0;

  await Promise.all(
    SECRET_NAMES.map(async (secretName) => {
      // Skip if already set via env var (e.g. from --update-env-vars)
      if (process.env[secretName]) {
        skipped++;
        return;
      }

      try {
        const [version] = await client.accessSecretVersion({
          name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
        });

        const value = version.payload?.data?.toString()?.trim();
        if (value) {
          process.env[secretName] = value;
          loaded++;
        }
      } catch (error: any) {
        // Secret doesn't exist — not critical, some are optional
        if (error.code === 5) {
          // NOT_FOUND
          return;
        }
        console.warn(`Failed to load secret "${secretName}":`, error.message);
      }
    })
  );

  console.log(
    `Secret Manager: loaded ${loaded} secrets, ${skipped} already set via env`
  );
}
