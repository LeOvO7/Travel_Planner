import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, X } from 'lucide-react';

/**
 * useNetworkStatus Hook
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}

/**
 * NetworkStatusBanner
 */
export default function NetworkStatusBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!isOnline || wasOffline) {
      setIsDismissed(false);
    }
  }, [isOnline, wasOffline]);

  if (isDismissed) return null;

  // Offline state
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#EF4444] text-white px-4 py-3 shadow-lg animate-slideDown">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5" />
            <div>
              <p className="font-semibold">No Internet Connection</p>
              <p className="text-sm text-red-100">
                Please check your network and try again
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-red-600 rounded transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Reconnected state
  if (wasOffline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#10B981] text-white px-4 py-3 shadow-lg animate-slideDown">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wifi className="w-5 h-5" />
            <div>
              <p className="font-semibold">Back Online</p>
              <p className="text-sm text-emerald-100">
                Your connection has been restored
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-emerald-600 rounded transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * ConnectionErrorCard
 */
export function ConnectionErrorCard({
  title = 'Connection Error',
  message = 'Unable to connect to the server',
  onRetry,
  onDismiss,
  showDetails = false,
  errorDetails = null,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="my-5 bg-red-50 border-2 border-[#EF4444]/30 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5">
        {/* Error header */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <WifiOff className="w-5 h-5 text-[#EF4444]" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[#0F172A] mb-1">
              {title}
            </h3>
            <p className="text-sm text-[#64748B] mb-3">
              {message}
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#EF4444] hover:bg-red-600 text-white rounded-lg font-medium transition-all duration-200 text-sm hover:shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reconnect
                </button>
              )}

              {showDetails && errorDetails && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-[#0F172A] rounded-lg font-medium transition-all duration-200 text-sm"
                >
                  {isExpanded ? 'Hide Details' : 'View Details'}
                </button>
              )}

              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#0F172A] rounded-lg font-medium transition-all duration-200 text-sm"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>

          {/* Close button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-[#EF4444]" />
            </button>
          )}
        </div>

        {/* Error details */}
        {isExpanded && errorDetails && (
          <div className="mt-4 p-3 bg-white border border-[#E2E8F0] rounded-lg">
            <h4 className="text-sm font-semibold text-[#0F172A] mb-2">
              Technical Details:
            </h4>
            <pre className="text-xs text-[#64748B] overflow-x-auto font-mono">
              {JSON.stringify(errorDetails, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * TimeoutErrorCard
 */
export function TimeoutErrorCard({
  timeout = 30000,
  onRetry,
  onDismiss,
}) {
  return (
    <ConnectionErrorCard
      title="Request Timeout"
      message={`The request took longer than ${timeout / 1000} seconds and was cancelled. Please check your connection and try again.`}
      onRetry={onRetry}
      onDismiss={onDismiss}
      errorDetails={{
        type: 'TIMEOUT',
        timeout: `${timeout}ms`,
        timestamp: new Date().toISOString(),
      }}
      showDetails={true}
    />
  );
}

// CSS animation
export const networkStatusStyles = `
@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slideDown {
  animation: slideDown 0.3s ease-out;
}
`;
