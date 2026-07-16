import Spinner from "../Spinner";

export default function Loader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-8 py-7 shadow-sm">
        <Spinner size={32} withText label={label} />
      </div>
    </div>
  );
}
