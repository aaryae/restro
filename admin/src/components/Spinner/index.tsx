import { FC } from "react";

interface SpinnerProps {
  size?: number;
  className?: string;
  withText?: boolean;
  label?: string;
}

const Spinner: FC<SpinnerProps> = ({
  size = 28,
  className = "",
  withText = false,
  label = "Loading",
}) => {
  return (
    <div
      role="status"
      aria-label={label}
      className={`inline-flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <span
        className="inline-block animate-spin rounded-full border-[3px] border-slate-200 border-t-[var(--primary-color)]"
        style={{ width: size, height: size }}
      />
      {withText && (
        <span className="text-sm font-medium tracking-wide text-slate-500">
          {label}
        </span>
      )}
    </div>
  );
};

export default Spinner;
