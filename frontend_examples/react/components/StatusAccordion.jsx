import { useState } from 'react';
import { ChevronDown, ChevronRight, Loader2, CheckCircle, Clock, Wrench, AlertCircle, Zap } from 'lucide-react';

/**
 * StatusAccordion - Workflow status accordion panel
 */
export default function StatusAccordion({ steps, isActive = false }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!steps || steps.length === 0) return null;

  return (
    <div className="my-5 border border-[#E2E8F0] rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Accordion header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50
                 hover:bg-slate-100 transition-all duration-200 text-left"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-[#64748B]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#64748B]" />
          )}
          <Zap className="w-4 h-4 text-[#6366F1]" />
          <span className="font-medium text-[#0F172A]">
            Workflow Steps
          </span>
          <span className="text-xs px-2 py-0.5 bg-indigo-50 text-[#6366F1] rounded-full font-medium">
            {steps.length} {steps.length === 1 ? 'step' : 'steps'}
          </span>
        </div>

        {isActive && (
          <div className="flex items-center gap-2 text-sm text-[#6366F1]">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="font-medium">Processing...</span>
          </div>
        )}
      </button>

      {/* Accordion content */}
      {isExpanded && (
        <div className="px-5 py-4 space-y-3 bg-white">
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
 * StepItem - Single workflow step
 */
function StepItem({ step, index, isLast }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = () => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-[#10B981]" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-[#6366F1] animate-spin" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-[#64748B]" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-[#EF4444]" />;
      default:
        return <Clock className="w-5 h-5 text-[#64748B]" />;
    }
  };

  const getStatusColor = () => {
    switch (step.status) {
      case 'completed':
        return 'border-emerald-200 bg-emerald-50';
      case 'processing':
        return 'border-indigo-200 bg-indigo-50';
      case 'pending':
        return 'border-[#E2E8F0] bg-slate-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-[#E2E8F0] bg-slate-50';
    }
  };

  return (
    <div className="relative">
      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-2.5 top-8 bottom-0 w-0.5 bg-[#E2E8F0]" />
      )}

      {/* Step content */}
      <div className={`relative border rounded-lg p-3 ${getStatusColor()}`}>
        <div className="flex items-start gap-3">
          {/* Status icon */}
          <div className="flex-shrink-0 mt-0.5">
            {getStatusIcon()}
          </div>

          {/* Step info */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="font-medium text-sm text-[#0F172A]">
                {step.title || `Step ${index + 1}`}
              </h4>
              {step.duration && (
                <span className="text-xs text-[#64748B]">
                  {formatDuration(step.duration)}
                </span>
              )}
            </div>

            {/* Description */}
            {step.description && (
              <p className="text-sm text-[#64748B] mb-2">
                {step.description}
              </p>
            )}

            {/* Tool call info */}
            {step.type === 'tool_call' && step.tool && (
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-3.5 h-3.5 text-[#6366F1]" />
                <code className="text-xs bg-white px-2 py-1 rounded border border-indigo-200 text-[#6366F1]">
                  {step.tool}
                </code>
                {step.args && Object.keys(step.args).length > 0 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-[#6366F1] hover:text-indigo-600 underline"
                  >
                    {isExpanded ? 'Hide' : 'View'} details
                  </button>
                )}
              </div>
            )}

            {/* Expanded details */}
            {isExpanded && step.args && (
              <div className="mt-2 p-2 bg-white rounded border border-[#E2E8F0]">
                <pre className="text-xs text-[#0F172A] overflow-x-auto">
                  {JSON.stringify(step.args, null, 2)}
                </pre>
              </div>
            )}

            {/* Result preview */}
            {step.result && (
              <div className="mt-2 text-xs text-[#64748B] bg-white p-2 rounded border border-[#E2E8F0]">
                <span className="font-medium">Result: </span>
                {step.result.substring(0, 100)}
                {step.result.length > 100 && '...'}
              </div>
            )}

            {/* Error info */}
            {step.error && (
              <div className="mt-2 text-xs text-[#EF4444] bg-red-50 p-2 rounded border border-red-200">
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
 * LoadingIndicator - Loading indicator with multiple styles
 */
export function LoadingIndicator({ type = 'spinner', message = 'Loading...', className = '' }) {
  const renderIndicator = () => {
    switch (type) {
      case 'spinner':
        return (
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-[#6366F1] animate-spin" />
            <span className="text-sm text-[#0F172A]">{message}</span>
          </div>
        );

      case 'dots':
        return (
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-[#6366F1] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-[#6366F1] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-[#6366F1] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-[#0F172A]">{message}</span>
          </div>
        );

      case 'pulse':
        return (
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-[#6366F1] rounded-full animate-pulse" />
            <span className="text-sm text-[#0F172A]">{message}</span>
          </div>
        );

      case 'bars':
        return (
          <div className="flex items-center gap-3">
            <div className="flex items-end gap-1 h-5">
              <div className="w-1 bg-[#6366F1] rounded-full animate-bar" style={{ animationDelay: '0ms' }} />
              <div className="w-1 bg-[#6366F1] rounded-full animate-bar" style={{ animationDelay: '100ms' }} />
              <div className="w-1 bg-[#6366F1] rounded-full animate-bar" style={{ animationDelay: '200ms' }} />
              <div className="w-1 bg-[#6366F1] rounded-full animate-bar" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-[#0F172A]">{message}</span>
          </div>
        );

      default:
        return (
          <span className="text-sm text-[#0F172A]">{message}</span>
        );
    }
  };

  return (
    <div className={`inline-flex items-center px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-lg ${className}`}>
      {renderIndicator()}
    </div>
  );
}

/**
 * ProgressBar
 */
export function ProgressBar({ current, total, showPercentage = true, className = '' }) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className={`w-full ${className}`}>
      {showPercentage && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-[#0F172A]">Progress</span>
          <span className="text-sm font-medium text-[#6366F1]">{percentage}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-[#6366F1] transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

// CSS animation styles (add to global CSS)
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

export { animationStyles };
