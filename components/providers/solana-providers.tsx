"use client";

import { useMemo, type ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

// Default styles for the wallet modal
import "@solana/wallet-adapter-react-ui/styles.css";

/**
 * Wraps the app with Solana wallet adapter providers.
 * The endpoint is public (read-only). Sensitive ops use server-side Helius RPC.
 */
export function SolanaProviders({ children }: { children: ReactNode }) {
  const endpoint = useMemo(
    () =>
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
      "https://api.mainnet-beta.solana.com",
    []
  );

  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
