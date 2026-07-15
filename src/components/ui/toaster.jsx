import { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = ({ title, description, variant = "default" }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 left-4 z-[100] space-y-2" dir="rtl">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg shadow-lg p-4 max-w-sm animate-slide-up ${
              t.variant === "destructive"
                ? "bg-red-600 text-white"
                : "bg-white border border-gray-200 text-gray-800"
            }`}
          >
            {t.title && <p className="font-semibold text-sm">{t.title}</p>}
            {t.description && <p className="text-xs mt-1 opacity-90">{t.description}</p>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toast: () => {} };
  return ctx;
}
