export interface ProtocolMetadata {
  slug: string;
  displayName: string;
  officialUrl: string;
}

export const PROTOCOL_REGISTRY: Record<string, ProtocolMetadata> = {
  "kamino-lend": {
    slug: "kamino-lend",
    displayName: "Kamino",
    officialUrl: "https://app.kamino.finance",
  },
  "kamino-liquidity": {
    slug: "kamino-liquidity",
    displayName: "Kamino Liquidity",
    officialUrl: "https://app.kamino.finance",
  },
  "drift": {
    slug: "drift",
    displayName: "Drift",
    officialUrl: "https://app.drift.trade",
  },
  "marginfi": {
    slug: "marginfi",
    displayName: "MarginFi",
    officialUrl: "https://app.marginfi.com",
  },
  "save": {
    slug: "save",
    displayName: "Save",
    officialUrl: "https://save.finance",
  },
  "orca-dex": {
    slug: "orca-dex",
    displayName: "Orca",
    officialUrl: "https://orca.so",
  },
};

/**
 * Enriches and normalizes protocol slugs dynamically.
 */
export function getProtocolMetadata(slug: string): ProtocolMetadata {
  const normalizedSlug = slug.toLowerCase();
  const registered = PROTOCOL_REGISTRY[normalizedSlug];
  if (registered) return registered;

  // Fallback for unregistered dynamic slugs
  const formattedName = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    slug,
    displayName: formattedName,
    officialUrl: "https://solana.com", // Safe default
  };
}
