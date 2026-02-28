import React, { useEffect, useRef } from "react";

export type ToastType = "error" | "warning" | "info";

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message: string;
}

interface ErrorToastProps {
    toasts: Toast[];
    onDismiss: (id: string) => void;
}

const ICONS: Record<ToastType, string> = {
    error: "🚫",
    warning: "⚠️",
    info: "ℹ️",
};

const ErrorToast: React.FC<ErrorToastProps> = ({ toasts, onDismiss }) => {
    const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    useEffect(() => {
        toasts.forEach((t) => {
            if (!timers.current[t.id]) {
                timers.current[t.id] = setTimeout(() => {
                    onDismiss(t.id);
                    delete timers.current[t.id];
                }, 5000);
            }
        });
        return () => { };
    }, [toasts, onDismiss]);

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`toast ${t.type}`}
                    onClick={() => onDismiss(t.id)}
                >
                    <span className="toast-icon">{ICONS[t.type]}</span>
                    <div>
                        <div className="toast-title">{t.title}</div>
                        <div className="toast-msg">{t.message}</div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ErrorToast;
