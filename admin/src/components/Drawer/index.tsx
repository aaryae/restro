import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { RxCross2 } from "react-icons/rx";
import { cn } from "../../lib/utils";

interface DrawerType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
  width?: string;
  position?: "left" | "right" | "bottom";
  className?: string;
  contentClassName?: string;
  /** Hide the default top close bar (use when children render their own header). */
  hideHeader?: boolean;
}

export default function Drawer({
  isOpen,
  setIsOpen,
  children,
  width = "w-full lg:w-1/2",
  position = "right",
  className,
  contentClassName = "p-4",
  hideHeader = false,
}: Readonly<DrawerType>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const body = document.body;
    const html = document.documentElement;
    const scrollY = window.scrollY;

    const previous = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyLeft: body.style.left,
      bodyRight: body.style.right,
      bodyWidth: body.style.width,
      bodyPaddingRight: body.style.paddingRight,
      htmlOverflow: html.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
    };

    // Prevent layout shift when the scrollbar disappears.
    const scrollbarGap = window.innerWidth - html.clientWidth;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    if (scrollbarGap > 0) {
      body.style.paddingRight = `${scrollbarGap}px`;
    }
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";

    return () => {
      body.style.overflow = previous.bodyOverflow;
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.left = previous.bodyLeft;
      body.style.right = previous.bodyRight;
      body.style.width = previous.bodyWidth;
      body.style.paddingRight = previous.bodyPaddingRight;
      html.style.overflow = previous.htmlOverflow;
      html.style.overscrollBehavior = previous.htmlOverscroll;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  const toggleDrawer = () => {
    setIsOpen(false);
  };

  const stopBackgroundScroll = (
    event: React.TouchEvent | React.WheelEvent,
  ) => {
    event.preventDefault();
  };

  const isBottom = position === "bottom";

  return createPortal(
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close drawer backdrop"
          className="fixed inset-0 z-[90] touch-none bg-slate-900/40 backdrop-blur-[1px]"
          onClick={toggleDrawer}
          onTouchMove={stopBackgroundScroll}
          onWheel={stopBackgroundScroll}
        />
      )}
      <div
        className={cn(
          "fixed z-[100] flex max-w-full flex-col bg-white shadow-lg transition-transform duration-300 ease-in-out",
          isBottom
            ? "inset-x-0 bottom-0 h-[min(85dvh,36rem)] max-h-[min(92dvh,40rem)] rounded-t-2xl"
            : "inset-y-0 h-[100dvh] max-h-[100dvh]",
          !isBottom && (position === "right" ? "right-0" : "left-0"),
          isOpen
            ? "visible pointer-events-auto translate-x-0 translate-y-0"
            : isBottom
              ? "invisible pointer-events-none translate-y-full"
              : position === "right"
                ? "invisible pointer-events-none translate-x-full"
                : "invisible pointer-events-none -translate-x-full",
          !isBottom && width,
          isBottom && "w-full",
          className,
        )}
      >
        {isBottom && (
          <div className="flex shrink-0 justify-center pt-2.5 pb-1" aria-hidden>
            <span className="h-1 w-10 rounded-full bg-slate-300" />
          </div>
        )}

        {!hideHeader && (
          <div className="flex h-12 shrink-0 items-center justify-end border-b border-slate-100 px-3">
            <button
              type="button"
              onClick={toggleDrawer}
              aria-label="Close drawer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <RxCross2 size={18} />
            </button>
          </div>
        )}

        <div
          className={cn(
            "drawer-content flex min-h-0 flex-1 flex-col overscroll-contain",
            isBottom ? "overflow-hidden" : "overflow-y-auto",
            contentClassName,
          )}
        >
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}
