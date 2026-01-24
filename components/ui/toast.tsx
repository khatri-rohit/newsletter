'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X } from 'lucide-react';

interface Toast {
    id: string;
    title?: string;
    description?: string;
    variant?: 'default' | 'success' | 'error' | 'warning';
}

interface ToastContextType {
    toasts: Toast[];
    toast: (toast: Omit<Toast, 'id'>) => void;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { ...toast, id }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, toast, dismiss }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
              min-w-[300px] rounded-lg p-4 shadow-lg backdrop-blur-sm
              animate-in slide-in-from-right-full
              ${toast.variant === 'error'
                                ? 'bg-red-500/90 text-white'
                                : toast.variant === 'success'
                                    ? 'bg-green-500/90 text-white'
                                    : toast.variant === 'warning'
                                        ? 'bg-yellow-500/90 text-white'
                                        : 'bg-gray-900/90 text-white'
                            }
            `}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                                {toast.title && (
                                    <div className="font-semibold mb-1">{toast.title}</div>
                                )}
                                {toast.description && (
                                    <div className="text-sm opacity-90">{toast.description}</div>
                                )}
                            </div>
                            <button
                                onClick={() => dismiss(toast.id)}
                                className="hover:opacity-70 transition-opacity"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
