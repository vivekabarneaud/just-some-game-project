export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET ?? "medieval-realm-dev-secret",
  PORT: parseInt(process.env.PORT ?? "4000", 10),
};
