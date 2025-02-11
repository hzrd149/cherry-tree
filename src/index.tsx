import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import { QueryStoreProvider } from "applesauce-react";
import "window.nostr.js";

import "./index.css";
import App from "./app.tsx";
import WalletProvider from "./providers/wallet-provider";
import LocalWallet from "./services/local-wallet.ts";
import { ErrorBoundary } from "./components/error-boundary";
import { queryStore } from "./services/stores.ts";
import "./register";

const wallet = new LocalWallet();

createRoot(document.getElementById("root")!).render(
  <ChakraProvider>
    <QueryStoreProvider queryStore={queryStore}>
      <WalletProvider wallet={wallet}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </WalletProvider>
    </QueryStoreProvider>
  </ChakraProvider>,
);
