import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { RxCross2 } from "react-icons/rx";
import { cn } from "../../lib/utils";

interface DrawerType {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
  width?: string;
  position?: "left" | "right";
  className?: string;
  contentClassName?: string;
}

export default function Drawer({
  isOpen,
  setIsOpen,
  children,
  width = "w-full lg:w-1/2",
  position = "right",
  className,
  contentClassName = "p-4",
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

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const toggleDrawer = () => {
    setIsOpen(false);
  };

  return createPortal(
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close drawer backdrop"
          className="fixed inset-0 z-[60] bg-slate-900/25 backdrop-blur-[1px]"
          onClick={toggleDrawer}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 z-[70] flex h-screen max-w-full flex-col bg-white shadow-lg transition-transform duration-300 ease-in-out",
          position === "right" ? "right-0" : "left-0",
          isOpen
            ? "visible translate-x-0 pointer-events-auto"
            : position === "right"
              ? "invisible translate-x-full pointer-events-none"
              : "invisible -translate-x-full pointer-events-none",
          width,
          className,
        )}
      >
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

        <div
          className={cn(
            "drawer-content flex min-h-0 flex-1 flex-col overflow-y-auto",
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
