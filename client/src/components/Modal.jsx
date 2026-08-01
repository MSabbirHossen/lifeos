import React, { useState } from "react";
import { X } from "lucide-react";

const Modal = ({
  isOpen,
  title,
  children,
  onClose,
  onSubmit,
  submitLabel = "Submit",
  maxWidthClass = "max-w-md",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full ${maxWidthClass} p-6 max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={20} />
          </button>
        </div>
        <div className="mb-4">{children}</div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
