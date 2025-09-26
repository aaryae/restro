import cn from "clsx";

export default function SummaryCard({
  title,
  value,
  gradient,
  Icon,
  className,
}: {
  title: string;
  value: string;
  gradient: string;
  Icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-xl overflow-hidden shadow-sm border border-gray-200",
        className,
      )}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-90`}
      />
      <div className="relative p-5 flex items-center justify-between text-white">
        <div>
          <div className="text-sm/5 opacity-90 flex">{title}</div>
          <div className="text-2xl font-semibold mt-1 drop-shadow-sm text-left">
            {value}
          </div>
        </div>
        <div className="h-12 w-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
