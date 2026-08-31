import { useEffect } from "react";
import { redirectToServeLogin } from "@/utils/serveAuth";

/** Any legacy `/login` bookmark immediately goes to Serve (port 3000). */
export default function ServeLoginRedirect() {
  useEffect(() => {
    redirectToServeLogin();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--serve-bg,#0c0c0e)] text-sm text-[var(--serve-muted,#a3a3ac)]">
      Redirecting to Serve login…
    </main>
  );
}
