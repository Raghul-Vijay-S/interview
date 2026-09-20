import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV ?? "development";
const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET ?? "dev-only-nexvora-secret-change-me";

if (nodeEnv === "production") {
  const problems = [
    !databaseUrl && "DATABASE_URL is required",
    !process.env.CLIENT_ORIGIN && "CLIENT_ORIGIN is required",
    !process.env.JWT_SECRET && "JWT_SECRET is required",
    jwtSecret === "dev-only-nexvora-secret-change-me" && "JWT_SECRET must not use the development default"
  ].filter(Boolean);
  if (problems.length) throw new Error(`Invalid production configuration: ${problems.join(", ")}`);
}

export const config = {
  nodeEnv,
  port: Number(process.env.PORT ?? 8080),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  jwtSecret,
  databaseUrl,
  openAiKey: process.env.OPENAI_API_KEY,
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-1.5-flash",
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  }
};
