"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
}

export function Toast({
  message,
  type = "success",
  duration = 3000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isMounted) return null;

  const toastElement = (
    <div
      className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <div
        className={`max-w-sm rounded-lg px-4 py-3 shadow-lg ${
          type === "success"
            ? "bg-green-500 text-white"
            : type === "error"
              ? "bg-red-500 text-white"
              : "bg-blue-500 text-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{message}</span>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="ml-3 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(toastElement, document.body);
}

// Toast context for managing multiple toasts
interface ToastContextType {
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

import { createContext, useContext, type ReactNode } from "react";

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<
    Array<{ id: number; message: string; type: "success" | "error" | "info" }>
  >([]);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
