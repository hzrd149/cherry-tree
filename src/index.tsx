import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";

import "./index.css";
import App from "./app.tsx";
import WalletProvider from "./providers/wallet-provider";
import LocalWallet from "./local-wallet";
import { ErrorBoundary } from "./components/error-boundary";
import "./register";

const wallet = new LocalWallet();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChakraProvider>
      <WalletProvider wallet={wallet}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </WalletProvider>
    </ChakraProvider>
  </StrictMode>,
);
