import {
  address,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  pipe,
  type Address,
} from "@solana/kit";

import { env } from "@/lib/env";

export const rpc = createSolanaRpc(env.HELIUS_RPC_URL);

export const rpcSubscriptions = createSolanaRpcSubscriptions(
  env.HELIUS_RPC_URL.replace(/^http/, "ws")
);

export function toAddress(value: string): Address {
  return pipe(value, address);
}

export async function getLamportBalance(value: string): Promise<bigint> {
  const { value: lamports } = await rpc.getBalance(toAddress(value)).send();
  return lamports;
}

export async function getSolBalance(value: string): Promise<number> {
  const lamports = await getLamportBalance(value);
  return Number(lamports) / 1_000_000_000;
}

export { address, pipe };
export type { Address };
