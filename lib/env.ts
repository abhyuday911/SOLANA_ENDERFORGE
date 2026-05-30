import { z } from "zod";

const serverEnvSchema = z.object({
  // Helius RPC
  HELIUS_RPC_URL: z
    .string()
    .trim()
    .url()
    .describe("Helius mainnet RPC endpoint (https)"),

  // Jupiter Price API v3
  JUPITER_API_KEY: z
    .string()
    .trim()
    .min(1)
    .describe("Jupiter v3 price API key"),

  // Upstash Redis + Rate-limit
  UPSTASH_REDIS_REST_URL: z
    .string()
    .trim()
    .url()
    .describe("Upstash Redis REST URL"),
  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .trim()
    .min(1)
    .describe("Upstash Redis REST token"),

  // Groq AI
  GROQ_API_KEY: z
    .string()
    .trim()
    .min(1)
    .describe("Groq cloud API key"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates and returns the server environment variables.
 */
function parseEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(`Invalid server environment:\n${formatted}`);
  }

  return result.data;
}

// Export the validated env object directly. 
// Next.js will evaluate this on the server.
export const env = parseEnv();

