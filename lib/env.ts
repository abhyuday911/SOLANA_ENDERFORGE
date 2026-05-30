import { z } from "zod";

/**
 * Zod-validated server-side environment configuration.
 * Every external service key is required and validated at startup.
 */
const serverEnvSchema = z.object({
  // Helius RPC
  HELIUS_RPC_URL: z
    .string()
    .url()
    .describe("Helius mainnet RPC endpoint (https)"),

  // Jupiter Price API v3
  JUPITER_API_KEY: z
    .string()
    .min(1)
    .describe("Jupiter v3 price API key"),

  // Upstash Redis + Rate-limit
  UPSTASH_REDIS_REST_URL: z
    .string()
    .url()
    .describe("Upstash Redis REST URL"),
  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .min(1)
    .describe("Upstash Redis REST token"),

  // Groq AI
  GROQ_API_KEY: z
    .string()
    .min(1)
    .describe("Groq cloud API key"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function parseEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ✗ ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `❌ Missing or invalid environment variables:\n${formatted}\n\nAdd them to .env.local`
    );
  }
  return result.data;
}

/**
 * Singleton env object – evaluated lazily on first access.
 * Only usable on the server (process.env is not available on the client).
 */
export const env = parseEnv();
