import React, { ReactNode } from "react";
import { createPortal } from "react-dom";
import "./model.css"; // Assuming you want custom styles

interface ModelProps {
  title?: string | ReactNode;
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

const Model: React.FC<ModelProps> = ({ title, children, isOpen, onClose }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-container" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          {title && <h3>{title}</h3>}
          <button className="popup-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="popup-content">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

export default Model;
