import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { RxCross2 } from "react-icons/rx";

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
        className={`fixed inset-y-0 z-[70] ${
          position === "right" ? "right-0" : "left-0"
        } h-screen max-w-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
          isOpen
            ? "visible translate-x-0 pointer-events-auto"
            : position === "right"
              ? "invisible translate-x-full pointer-events-none"
              : "invisible -translate-x-full pointer-events-none"
        } ${width} ${className ?? ""}`}
      >
        <button
          onClick={toggleDrawer}
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white/95 text-slate-500 shadow-sm backdrop-blur transition hover:bg-white hover:text-slate-700"
        >
          <RxCross2 size={18} />
        </button>

        <div
          className={`drawer-content flex h-full flex-col overflow-y-auto ${contentClassName}`}
        >
          {children}
        </div>
      </div>
    </>,
    document.body,
  );
}
