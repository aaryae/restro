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
import { applyPlatformPosBootstrap } from "./utils/platformPosBootstrap";
import {
  hasValidPosSession,
  startSessionExpiryWatcher,
} from "./utils/serveAuth";

applyPlatformPosBootstrap();
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
          <AppToaster />
        </BrandingWrapper>
      </PersistGate>
    </Provider>
  </StrictMode>,
);
