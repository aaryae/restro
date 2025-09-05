import { useGetSettingQuery } from "@/redux/services/settings";
import { useEffect } from "react";

function BrandingWrapper({ children }) {
  const {
    data: settings,
    isSuccess: success,
    isLoading: loading,
    refetch,
  } = useGetSettingQuery("");

  useEffect(() => {
    const cachedColor = localStorage.getItem("brandColor");
    if (cachedColor) {
      document.documentElement.style.setProperty(
        "--primary-color",
        cachedColor,
      );
    }

    if (/^#[0-9A-F]{6}$/i.test(settings?.data?.primaryColor)) {
      document.documentElement.style.setProperty(
        "--primary-color",
        settings?.data?.primaryColor,
      );
      localStorage.setItem("brandColor", settings?.data?.primaryColor);
    }

    console.log(settings, "compnay settings fetched");
  }, [success, settings]);

  return <>{children}</>;
}

export default BrandingWrapper;
