export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET ?? "medieval-realm-dev-secret",
  PORT: parseInt(process.env.PORT ?? "4000", 10),
  // Google OAuth web client ID (public, not a secret). The default is the
  // project's real client ID so local dev works with zero env setup; override
  // via env on Render if it ever rotates.
  GOOGLE_CLIENT_ID:
    process.env.GOOGLE_CLIENT_ID ??
    "698020239210-inpdh9bl812bl8on47hg2ivmoh4nam07.apps.googleusercontent.com",
};
