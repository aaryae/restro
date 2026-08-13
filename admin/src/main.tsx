import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Routes } from "./routes.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { persistor, store } from "./redux/store/store.ts";
import { PersistGate } from "redux-persist/integration/react";
import BrandingWrapper from "./components/BrandingWrapper/BrandingWrapper.tsx";
import AppToaster from "./components/Toast/AppToaster.tsx";
import { applyPlatformPosBootstrap } from "./utils/platformPosBootstrap";

applyPlatformPosBootstrap();

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
