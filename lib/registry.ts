export type ProtocolStatus = "verified" | "unverified";

export interface ProtocolMetadata {
  slug: string;
  displayName: string;
  status: ProtocolStatus;
  officialUrl?: string;
}

export const PROTOCOL_REGISTRY: Record<string, ProtocolMetadata> = {
  "kamino": {
    slug: "kamino",
    displayName: "Kamino",
    status: "verified",
    officialUrl: "https://app.kamino.finance",
  },
  "drift": {
    slug: "drift",
    displayName: "Drift",
    status: "verified",
    officialUrl: "https://app.drift.trade",
  },
  "marginfi": {
    slug: "marginfi",
    displayName: "MarginFi",
    status: "verified",
    officialUrl: "https://app.marginfi.com",
  },
  "save": {
    slug: "save",
    displayName: "Save",
    status: "verified",
    officialUrl: "https://save.finance",
  },
  "jito": {
    slug: "jito",
    displayName: "Jito",
    status: "verified",
    officialUrl: "https://www.jito.network",
  },
  "meteora": {
    slug: "meteora",
    displayName: "Meteora",
    status: "verified",
    officialUrl: "https://app.meteora.ag",
  },
  "sanctum": {
    slug: "sanctum",
    displayName: "Sanctum",
    status: "verified",
    officialUrl: "https://app.sanctum.so",
  },
  "marinade": {
    slug: "marinade",
    displayName: "Marinade",
    status: "verified",
    officialUrl: "https://marinade.finance",
  },
  "solend": {
    slug: "solend",
    displayName: "Solend",
    status: "verified",
    officialUrl: "https://solend.fi",
  },
  "orca": {
    slug: "orca",
    displayName: "Orca",
    status: "verified",
    officialUrl: "https://orca.so",
  },
};

/**
 * Enriches and normalizes protocol slugs dynamically.
 */
export function getProtocolMetadata(slug: string): ProtocolMetadata {
  const normalizedSlug = slug.toLowerCase();

  // Try exact match first
  if (PROTOCOL_REGISTRY[normalizedSlug]) {
    return PROTOCOL_REGISTRY[normalizedSlug];
  }

  // Try prefix matching (e.g., "kamino-lend" matches "kamino", "orca-dex" matches "orca")
  for (const key of Object.keys(PROTOCOL_REGISTRY)) {
    if (normalizedSlug.startsWith(key) || key.startsWith(normalizedSlug)) {
      return {
        ...PROTOCOL_REGISTRY[key],
        slug, // keep original slug
      };
    }
  }

  // Fallback for unregistered dynamic slugs
  const formattedName = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    slug,
    displayName: formattedName,
    status: "unverified",
    // officialUrl is left undefined
  };
}
