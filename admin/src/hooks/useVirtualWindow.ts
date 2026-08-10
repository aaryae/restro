import { useCallback, useEffect, useState } from "react";

type VirtualRange = {
  start: number;
  end: number;
};

export function useVirtualWindow(
  itemCount: number,
  options: { itemHeight: number; overscan?: number },
) {
  const { itemHeight, overscan = 4 } = options;
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [range, setRange] = useState<VirtualRange>({
    start: 0,
    end: Math.min(itemCount, 20),
  });

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  useEffect(() => {
    if (!container || itemCount === 0) {
      setRange({ start: 0, end: Math.min(itemCount, 20) });
      return;
    }

    const update = () => {
      const { scrollTop, clientHeight } = container;
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const visibleCount = Math.ceil(clientHeight / itemHeight) + overscan * 2;
      const end = Math.min(itemCount, start + visibleCount);
      setRange((prev) =>
        prev.start === start && prev.end === end ? prev : { start, end },
      );
    };

    update();
    container.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => {
      container.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [container, itemCount, itemHeight, overscan]);

  const totalHeight = itemCount * itemHeight;
  const offsetY = range.start * itemHeight;

  return { containerRef, range, totalHeight, offsetY };
}
