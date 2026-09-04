import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./theme-serve.css";
import "./styles/print.css";
import "./pages/Dashboard/dashboard.css";
import { Routes } from "./routes.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { persistor, store } from "./redux/store/store.ts";
import { PersistGate } from "redux-persist/integration/react";
import BrandingWrapper from "./components/BrandingWrapper/BrandingWrapper.tsx";
import AppToaster from "./components/Toast/AppToaster.tsx";
import TrialLifecycleGate from "./components/TrialLifecycleGate";
import { applyPlatformPosBootstrap } from "./utils/platformPosBootstrap";
import { redirectToTenantSubdomainIfNeeded } from "./utils/tenantHandler";
import {
  hasValidPosSession,
  startSessionExpiryWatcher,
} from "./utils/serveAuth";

async function boot() {
  await applyPlatformPosBootstrap();
  if (redirectToTenantSubdomainIfNeeded()) {
    // Full navigation in progress — do not mount the app on the shared pos host.
    return;
  }
  if (hasValidPosSession()) {
    startSessionExpiryWatcher();
  }

  const router = createBrowserRouter([...Routes]);

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Provider store={store}>
        <PersistGate persistor={persistor}>
          <BrandingWrapper>
            <RouterProvider router={router} />
            <TrialLifecycleGate />
            <AppToaster />
          </BrandingWrapper>
        </PersistGate>
      </Provider>
    </StrictMode>,
  );
}

void boot();
