import { useNavigate } from "react-router-dom";
import image from "@/assets/oops-image.png";
export default function ErrorBoundary() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden p-4">
      <div className="flex w-full max-w-lg flex-col items-center gap-2 text-center">
        <img
          src={image}
          alt="Page load failed"
          className="h-auto w-full max-w-[320px]"
        />
        <div className="font-bold text-primary">404 - PAGE NOT FOUND</div>
        <p>
          The Page you are Looking for might have been removed, had its name
          changed or is temporarily unavailable
        </p>
        <button
          className="mt-2 rounded-full bg-[#1d4ed8] px-4 py-3 text-white"
          onClick={() => navigate("/admin/dashboard")}
        >
          Go To Homepage
        </button>
      </div>
    </div>
  );
}
