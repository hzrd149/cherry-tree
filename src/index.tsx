import { ChakraProvider } from "@chakra-ui/react";
import { EventStoreProvider } from "applesauce-react/providers";
import { createRoot } from "react-dom/client";

import App from "./app.tsx";
import { ErrorBoundary } from "./components/error-boundary";
import WalletProvider from "./providers/wallet-provider";
import LocalWallet from "./services/local-wallet.ts";
import { eventStore } from "./services/nostr.ts";
import "./index.css";
import "./register";

const wallet = new LocalWallet();

createRoot(document.getElementById("root")!).render(
  <ChakraProvider>
    <EventStoreProvider eventStore={eventStore}>
      <WalletProvider wallet={wallet}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </WalletProvider>
    </EventStoreProvider>
  </ChakraProvider>,
);
