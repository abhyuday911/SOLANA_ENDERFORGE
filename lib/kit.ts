import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address,
  lamportsToSol,
  type Address,
} from "@solana/kit";
import { env } from "./env";

/**
 * Solana Kit – functional RPC setup.
 * NO `new Connection()` or legacy @solana/web3.js classes.
 */

/** Mainnet JSON-RPC instance */
export const rpc = createSolanaRpc(env.HELIUS_RPC_URL);

/** WebSocket subscriptions (derive wss from https RPC URL) */
const wsUrl = env.HELIUS_RPC_URL.replace("https://", "wss://");
export const rpcSubscriptions = createSolanaRpcSubscriptions(wsUrl);

/**
 * Create a validated Solana address from a base58 string.
 * Uses the functional `address()` helper from @solana/kit.
 */
export function toAddress(base58: string): Address {
  return address(base58);
}

/**
 * Fetch native SOL balance for an address (in SOL, not lamports).
 */
export async function getSolBalance(walletAddress: string): Promise<number> {
  const addr = toAddress(walletAddress);
  const { value: lamports } = await rpc
    .getBalance(addr)
    .send();
  return Number(lamportsToSol(lamports));
}

// Re-export commonly used helpers
export { address, lamportsToSol };
export type { Address };
