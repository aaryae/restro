import { useEffect } from "react";

function BrandingWrapper({ children }) {
  useEffect(() => {
    const stored = localStorage.getItem("serve-theme") || "dark";
    const html = document.documentElement;
    html.classList.remove("dark", "light");
    html.classList.add(stored);
    localStorage.removeItem("brandColor");
  }, []);

  return <>{children}</>;
}

export default BrandingWrapper;
