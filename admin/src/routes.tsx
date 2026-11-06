import React, { lazy, ReactNode, Suspense } from "react";
import { Navigate } from "react-router-dom";
import App from "./App";
import { adminLinks } from "./routes/adminLinks";
import Layout from "./layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundry";
import ServeLoginRedirect from "./components/ServeLoginRedirect";

const GuestPortal = lazy(() => import("./pages/GuestPortal"));

interface adminLinksType {
  path: string;
  element: ReactNode;
  errorElement?: React.ReactNode;
}

interface RouteItem {
  path: string;
  element: React.ReactNode;
  errorElement?: React.ReactNode;
  children?: adminLinksType[];
}

export const Routes: RouteItem[] = [
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/login",
    element: <ServeLoginRedirect />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/g",
    element: (
      <Suspense
        fallback={
          <main className="flex min-h-screen items-center justify-center bg-[#f7f1ea] text-sm text-[#6b5e54]">
            Opening menu…
          </main>
        }
      >
        <GuestPortal />
      </Suspense>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/g/:token",
    element: (
      <Suspense
        fallback={
          <main className="flex min-h-screen items-center justify-center bg-[#f7f1ea] text-sm text-[#6b5e54]">
            Opening menu…
          </main>
        }
      >
        <GuestPortal />
      </Suspense>
    ),
    errorElement: <ErrorBoundary />,
  },

  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/order/list" replace />,
      },
      ...adminLinks.map((each) => ({
        path: each.path.replace(/^\//, ""),
        // Each admin page is already React.lazy(); Layout wraps Outlet in Suspense.
        element: each.element,
      })),
    ],
    errorElement: <ErrorBoundary />,
  },
];
