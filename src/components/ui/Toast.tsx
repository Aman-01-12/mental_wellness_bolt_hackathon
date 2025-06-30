import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

const ToastContext = createContext<any>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((message: string) => {
    setToast({ message, id: Date.now() });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
    if (timer.current) clearTimeout(timer.current);
  }, []);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: 40,
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: '#2d3748',
            color: '#fff',
            padding: '16px 32px',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(44, 82, 130, 0.12)',
            fontSize: 16,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            minWidth: 220,
            maxWidth: '90vw',
            pointerEvents: 'auto',
          }}
          role="alert"
        >
          <span>{toast.message}</span>
          <button
            onClick={closeToast}
            style={{
              marginLeft: 16,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 20,
              cursor: 'pointer',
              lineHeight: 1,
            }}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
} 