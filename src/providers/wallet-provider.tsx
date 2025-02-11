import { createContext, PropsWithChildren, useContext } from "react";
import LocalWallet from "../services/local-wallet";

export const WalletContext = createContext<LocalWallet | null>(null);

export function useWallet() {
  const wallet = useContext(WalletContext);
  if (!wallet) throw new Error("Missing wallet");
  return wallet;
}

export default function WalletProvider({ wallet, children }: PropsWithChildren<{ wallet: LocalWallet }>) {
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>;
}
