import LOGO from "../../../public/fav.webp";

export default function Loader() {
  return (
    <div className="size-full flex absolute top-0 left-0 items-center justify-center">
      <div className="animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <img src={LOGO} alt="Logo" />
      </div>
    </div>
  );
}
