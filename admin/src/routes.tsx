import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import App from "./App";
import { adminLinks } from "./routes/adminLinks";
import Layout from "./layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundry";

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
    path: "/", // Make the login page the default route for /admin
    element: <App />,
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
