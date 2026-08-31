import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "small" | "medium" | "large" | "full";
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "medium",
  className = "",
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    small: "max-w-md",
    medium: "max-w-2xl",
    large: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="serve-overlay fixed inset-0"></div>

        <div
          role="dialog"
          aria-modal="true"
          className={`serve-modal relative w-full rounded-xl ${sizeClasses[size]} ${className}`}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-slate-400 transition-colors hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {/* Content */}
          <div className="relative">
            {!title && (
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-10 text-slate-400 transition-colors hover:text-slate-600"
              >
                <X size={18} />
              </button>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
