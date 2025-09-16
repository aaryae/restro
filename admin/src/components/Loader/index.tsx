import Spinner from "../Spinner";

export default function Loader() {
  return (
    <div className="size-full flex absolute top-0 left-0 items-center justify-center">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Spinner size={80} withText />
      </div>
    </div>
  );
}
