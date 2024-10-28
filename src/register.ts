// @ts-expect-error
import { registerSW } from "virtual:pwa-register";

if ("serviceWorker" in navigator) {
  registerSW({
    onOfflineReady() {
      console.log("App ready to work offline");
    },
  });
}
