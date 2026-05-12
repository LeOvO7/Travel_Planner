import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Toast Context
 */
const ToastContext = createContext(null);

/**
 * useToast Hook
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

/**
 * ToastProvider
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);

    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toast = useCallback({
    success: (message, options = {}) =>
      addToast({ type: 'success', message, ...options }),

    error: (message, options = {}) =>
      addToast({ type: 'error', message, ...options }),

    warning: (message, options = {}) =>
      addToast({ type: 'warning', message, ...options }),

    info: (message, options = {}) =>
      addToast({ type: 'info', message, ...options }),

    custom: (content, options = {}) =>
      addToast({ content, ...options }),
  }, [addToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * ToastContainer
 */
function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
}

/**
 * ToastItem
 */
function ToastItem({ toast, onClose }) {
  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          icon: CheckCircle,
          iconColor: 'text-[#10B981]',
          textColor: 'text-[#0F172A]',
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: AlertCircle,
          iconColor: 'text-[#EF4444]',
          textColor: 'text-[#0F172A]',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: AlertTriangle,
          iconColor: 'text-[#F59E0B]',
          textColor: 'text-[#0F172A]',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: Info,
          iconColor: 'text-[#3B82F6]',
          textColor: 'text-[#0F172A]',
        };
    }
  };

  const styles = getToastStyles();
  const Icon = styles.icon;

  return (
    <div
      className={`
        ${styles.bg} ${styles.border} border
        rounded-xl shadow-lg p-4 min-w-[300px] max-w-md
        pointer-events-auto animate-slideInRight
      `}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />

        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className={`font-semibold ${styles.textColor} mb-1`}>
              {toast.title}
            </p>
          )}
          <p className={`text-sm text-[#64748B]`}>
            {toast.message || toast.content}
          </p>

          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className={`mt-2 text-sm font-medium ${styles.iconColor} hover:underline`}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-slate-200 rounded transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-[#64748B]" />
        </button>
      </div>
    </div>
  );
}

/**
 * Alert Component
 */
export function Alert({
  type = 'info',
  title,
  message,
  children,
  onClose,
  onAction,
  actionLabel = 'Action',
  className = ''
}) {
  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50',
          border: 'border-emerald-200',
          icon: CheckCircle,
          iconBg: 'bg-emerald-100',
          iconColor: 'text-[#10B981]',
          titleColor: 'text-[#0F172A]',
          textColor: 'text-[#64748B]',
          buttonBg: 'bg-[#10B981] hover:bg-emerald-600',
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: AlertCircle,
          iconBg: 'bg-red-100',
          iconColor: 'text-[#EF4444]',
          titleColor: 'text-[#0F172A]',
          textColor: 'text-[#64748B]',
          buttonBg: 'bg-[#EF4444] hover:bg-red-600',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: AlertTriangle,
          iconBg: 'bg-amber-100',
          iconColor: 'text-[#F59E0B]',
          titleColor: 'text-[#0F172A]',
          textColor: 'text-[#64748B]',
          buttonBg: 'bg-[#F59E0B] hover:bg-amber-600',
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: Info,
          iconBg: 'bg-blue-100',
          iconColor: 'text-[#3B82F6]',
          titleColor: 'text-[#0F172A]',
          textColor: 'text-[#64748B]',
          buttonBg: 'bg-[#3B82F6] hover:bg-blue-600',
        };
    }
  };

  const styles = getAlertStyles();
  const Icon = styles.icon;

  return (
    <div className={`${styles.bg} ${styles.border} border-2 rounded-xl p-4 shadow-sm ${className}`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-10 h-10 ${styles.iconBg} rounded-full flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${styles.iconColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`font-semibold ${styles.titleColor} mb-1`}>
              {title}
            </h3>
          )}
          {message && (
            <p className={`text-sm ${styles.textColor}`}>
              {message}
            </p>
          )}
          {children && (
            <div className={`text-sm ${styles.textColor} mt-2`}>
              {children}
            </div>
          )}

          {onAction && (
            <button
              onClick={onAction}
              className={`mt-3 px-4 py-2 ${styles.buttonBg} text-white rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md`}
            >
              {actionLabel}
            </button>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:bg-slate-200 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[#64748B]" />
          </button>
        )}
      </div>
    </div>
  );
}

// CSS animation
export const toastStyles = `
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slideInRight {
  animation: slideInRight 0.3s ease-out;
}
`;
