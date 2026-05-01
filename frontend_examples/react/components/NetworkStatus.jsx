import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, X } from 'lucide-react';

/**
 * useNetworkStatus - 网络状态监控 Hook
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // 3秒后自动隐藏"重新连接"提示
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
 * NetworkStatusBanner - 网络状态横幅
 * 显示在页面顶部，提示用户网络状态
 */
export default function NetworkStatusBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  // 重置dismissed状态当网络状态改变时
  useEffect(() => {
    if (!isOnline || wasOffline) {
      setIsDismissed(false);
    }
  }, [isOnline, wasOffline]);

  if (isDismissed) return null;

  // 离线状态
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 shadow-lg animate-slideDown">
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
            className="p-1 hover:bg-red-700 rounded transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // 重新连接状态（短暂显示）
  if (wasOffline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white px-4 py-3 shadow-lg animate-slideDown">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wifi className="w-5 h-5" />
            <div>
              <p className="font-semibold">Back Online</p>
              <p className="text-sm text-green-100">
                Your connection has been restored
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-green-700 rounded transition-colors"
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
 * ConnectionErrorCard - 连接错误卡片
 * 用于显示连接超时或断开的错误
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
    <div className="my-4 bg-red-50 border-2 border-red-300 rounded-lg shadow-md overflow-hidden">
      <div className="p-4">
        {/* 错误头部 */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <WifiOff className="w-5 h-5 text-red-600" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-red-900 mb-1">
              {title}
            </h3>
            <p className="text-sm text-red-700 mb-3">
              {message}
            </p>

            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-2">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reconnect
                </button>
              )}

              {showDetails && errorDetails && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-medium transition-colors text-sm"
                >
                  {isExpanded ? 'Hide Details' : 'View Details'}
                </button>
              )}

              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors text-sm"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>

          {/* 关闭按钮 */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1 hover:bg-red-100 rounded transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-red-600" />
            </button>
          )}
        </div>

        {/* 错误详情 */}
        {isExpanded && errorDetails && (
          <div className="mt-4 p-3 bg-white border border-red-200 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              Technical Details:
            </h4>
            <pre className="text-xs text-gray-700 overflow-x-auto font-mono">
              {JSON.stringify(errorDetails, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * TimeoutErrorCard - 超时错误卡片
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

// CSS 动画（添加到全局样式）
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
