import { useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, CheckCircle, Clock, Wrench, AlertCircle, Zap } from 'lucide-react';

/**
 * StatusAccordion - 状态折叠面板
 * 用于显示工作流的中间状态和工具调用
 */
export default function StatusAccordion({ steps, isActive = false }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="my-4 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* 折叠面板头部 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50
                 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          )}
          <Zap className="w-4 h-4 text-purple-600" />
          <span className="font-medium text-gray-800">
            Workflow Steps
          </span>
          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
            {steps.length} {steps.length === 1 ? 'step' : 'steps'}
          </span>
        </div>

        {isActive && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
      </button>

      {/* 折叠面板内容 */}
      {isExpanded && (
        <div className="px-4 py-3 space-y-3 bg-white">
          {steps.map((step, index) => (
            <StepItem
              key={step.id || index}
              step={step}
              index={index}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * StepItem - 单个步骤项
 */
function StepItem({ step, index, isLast }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (step.status) {
      case 'completed':
        return 'border-green-300 bg-green-50';
      case 'processing':
        return 'border-blue-300 bg-blue-50';
      case 'pending':
        return 'border-gray-300 bg-gray-50';
      case 'error':
        return 'border-red-300 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="relative">
      {/* 连接线 */}
      {!isLast && (
        <div className="absolute left-2.5 top-8 bottom-0 w-0.5 bg-gray-200" />
      )}

      {/* 步骤内容 */}
      <div className={`relative border rounded-lg p-3 ${getStatusColor()}`}>
        <div className="flex items-start gap-3">
          {/* 状态图标 */}
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon()}
          </div>

          {/* 步骤信息 */}
          <div className="flex-1 min-w-0">
            {/* 标题行 */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="font-medium text-sm text-gray-900">
                {step.title || `Step ${index + 1}`}
              </h4>
              {step.duration && (
                <span className="text-xs text-gray-500">
                  {formatDuration(step.duration)}
                </span>
              )}
            </div>

            {/* 描述 */}
            {step.description && (
              <p className="text-sm text-gray-600 mb-2">
                {step.description}
              </p>
            )}

            {/* 工具调用信息 */}
            {step.type === 'tool_call' && step.tool && (
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-3.5 h-3.5 text-purple-600" />
                <code className="text-xs bg-white px-2 py-1 rounded border border-purple-200 text-purple-700">
                  {step.tool}
                </code>
                {step.args && Object.keys(step.args).length > 0 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-blue-600 hover:text-blue-700 underline"
                  >
                    {isExpanded ? 'Hide' : 'View'} details
                  </button>
                )}
              </div>
            )}

            {/* 展开的详细信息 */}
            {isExpanded && step.args && (
              <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                <pre className="text-xs text-gray-700 overflow-x-auto">
                  {JSON.stringify(step.args, null, 2)}
                </pre>
              </div>
            )}

            {/* 结果预览 */}
            {step.result && (
              <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                <span className="font-medium">Result: </span>
                {step.result.substring(0, 100)}
                {step.result.length > 100 && '...'}
              </div>
            )}

            {/* 错误信息 */}
            {step.error && (
              <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
                <span className="font-medium">Error: </span>
                {step.error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * LoadingIndicator - 加载指示器
 * 多种动画效果
 */
export function LoadingIndicator({ type = 'spinner', message = 'Loading...', className = '' }) {
  const renderIndicator = () => {
    switch (type) {
      case 'spinner':
        return (
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-sm text-gray-700">{message}</span>
          </div>
        );

      case 'dots':
        return (
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-gray-700">{message}</span>
          </div>
        );

      case 'pulse':
        return (
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-blue-600 rounded-full animate-pulse" />
            <span className="text-sm text-gray-700">{message}</span>
          </div>
        );

      case 'bars':
        return (
          <div className="flex items-center gap-3">
            <div className="flex items-end gap-1 h-5">
              <div className="w-1 bg-blue-600 rounded-full animate-bar" style={{ animationDelay: '0ms' }} />
              <div className="w-1 bg-blue-600 rounded-full animate-bar" style={{ animationDelay: '100ms' }} />
              <div className="w-1 bg-blue-600 rounded-full animate-bar" style={{ animationDelay: '200ms' }} />
              <div className="w-1 bg-blue-600 rounded-full animate-bar" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-gray-700">{message}</span>
          </div>
        );

      default:
        return (
          <span className="text-sm text-gray-700">{message}</span>
        );
    }
  };

  return (
    <div className={`inline-flex items-center px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      {renderIndicator()}
    </div>
  );
}

/**
 * ProgressBar - 进度条
 */
export function ProgressBar({ current, total, showPercentage = true, className = '' }) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className={`w-full ${className}`}>
      {showPercentage && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-700">Progress</span>
          <span className="text-sm font-medium text-blue-600">{percentage}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// 辅助函数：格式化持续时间
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

// CSS 动画样式（需要添加到全局 CSS）
const animationStyles = `
@keyframes bar {
  0%, 100% {
    height: 40%;
  }
  50% {
    height: 100%;
  }
}

.animate-bar {
  animation: bar 1s ease-in-out infinite;
}
`;

// 导出动画样式以便在主 CSS 文件中使用
export { animationStyles };
