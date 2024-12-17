import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { QueryStoreProvider } from "applesauce-react";
import "window.nostr.js";

import "./index.css";
import App from "./app.tsx";
import WalletProvider from "./providers/wallet-provider";
import LocalWallet from "./local-wallet";
import { ErrorBoundary } from "./components/error-boundary";
import "./register";
import { queryStore } from "./core";

const wallet = new LocalWallet();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChakraProvider>
      <QueryStoreProvider queryStore={queryStore}>
        <WalletProvider wallet={wallet}>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </WalletProvider>
      </QueryStoreProvider>
    </ChakraProvider>
  </StrictMode>,
);
