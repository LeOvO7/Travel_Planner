import { useEffect, useRef } from 'react';
import { User, Bot, AlertCircle } from 'lucide-react';
import MarkdownRenderer, { StreamingMarkdown } from './MarkdownRenderer';
import StatusAccordion, { LoadingIndicator } from './StatusAccordion';

/**
 * ChatMessage-Enhanced
 */
export default function ChatMessage({ message }) {
  const messageRef = useRef(null);

  useEffect(() => {
    messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [message]);

  const renderMessage = () => {
    switch (message.type) {
      case 'user':
        return <UserMessage message={message} />;
      case 'assistant':
        return <AssistantMessage message={message} />;
      case 'streaming':
        return <StreamingMessage message={message} />;
      case 'workflow':
        return <WorkflowMessage message={message} />;
      case 'status':
        return <StatusMessage message={message} />;
      case 'tool_call':
        return <ToolCallMessage message={message} />;
      case 'error':
        return <ErrorMessage message={message} />;
      default:
        return null;
    }
  };

  return (
    <div ref={messageRef} className="animate-fadeIn">
      {renderMessage()}
    </div>
  );
}

/**
 * UserMessage
 */
function UserMessage({ message }) {
  return (
    <div className="flex gap-4 mb-6 justify-end">
      <div className="max-w-[80%] lg:max-w-[70%]">
        <div className="bg-[#6366F1] text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {/* Metadata */}
        {message.metadata && (
          <div className="text-xs text-[#64748B] mt-1.5 text-right space-x-2">
            {message.metadata.destination && (
              <span>📍 {message.metadata.destination}</span>
            )}
            {message.metadata.dates && (
              <span>📅 {message.metadata.dates}</span>
            )}
          </div>
        )}

        {/* Timestamp */}
        {message.timestamp && (
          <div className="text-xs text-[#64748B] mt-1 text-right">
            {formatTime(message.timestamp)}
          </div>
        )}
      </div>

      {/* User avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center shadow-sm">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
}

/**
 * AssistantMessage
 */
function AssistantMessage({ message }) {
  return (
    <div className="flex gap-4 mb-6">
      {/* AI avatar */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center shadow-sm">
          <Bot className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="flex-1 max-w-[80%] lg:max-w-[70%]">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          {/* Markdown rendering */}
          <MarkdownRenderer content={message.content} />

          {/* Metadata */}
          {message.metadata && (
            <div className="mt-3 pt-3 border-t border-[#E2E8F0]">
              <div className="text-xs text-[#64748B] space-y-1">
                {message.metadata.model && (
                  <div>Model: {message.metadata.model}</div>
                )}
                {message.metadata.tokens && (
                  <div>Tokens: {message.metadata.tokens}</div>
                )}
                {message.metadata.duration && (
                  <div>Duration: {formatDuration(message.metadata.duration)}</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Timestamp */}
        {message.timestamp && (
          <div className="text-xs text-[#64748B] mt-1">
            {formatTime(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * StreamingMessage
 */
function StreamingMessage({ message }) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center shadow-sm">
          <Bot className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="flex-1 max-w-[80%] lg:max-w-[70%]">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          {/* Streaming Markdown rendering */}
          <StreamingMarkdown
            content={message.content}
            isStreaming={true}
          />
        </div>

        {/* Streaming indicator */}
        <div className="flex items-center gap-2 text-xs text-[#64748B] mt-2">
          <LoadingIndicator type="dots" message="AI is generating..." className="bg-transparent border-0 p-0" />
        </div>
      </div>
    </div>
  );
}

/**
 * WorkflowMessage
 */
function WorkflowMessage({ message }) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center shadow-sm">
          <Bot className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="flex-1 max-w-[80%] lg:max-w-[70%]">
        {/* Workflow steps */}
        <StatusAccordion
          steps={message.steps}
          isActive={message.status === 'processing'}
        />

        {/* Final result */}
        {message.result && (
          <div className="mt-4 bg-white border border-[#E2E8F0] rounded-2xl px-4 py-3 shadow-sm">
            <MarkdownRenderer content={message.result} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * StatusMessage
 */
function StatusMessage({ message }) {
  return (
    <div className="flex justify-center mb-4">
      <LoadingIndicator
        type={message.indicatorType || 'spinner'}
        message={message.content}
      />
    </div>
  );
}

/**
 * ToolCallMessage
 */
function ToolCallMessage({ message }) {
  return (
    <div className="flex justify-center mb-4">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-[#E2E8F0] rounded-full text-sm text-[#0F172A]">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-[#6366F1] rounded-full animate-pulse" />
          <span className="font-medium">Tool:</span>
          <code className="bg-indigo-50 text-[#6366F1] px-2 py-0.5 rounded text-xs font-medium">
            {message.tool}
          </code>
        </div>

        {message.args && message.args.city && (
          <span className="text-[#64748B]">
            → {message.args.city}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * ErrorMessage
 */
function ErrorMessage({ message }) {
  return (
    <div className="mb-4">
      <div className="bg-red-50 border border-[#EF4444]/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#0F172A] mb-1">
              Error occurred
            </p>
            <p className="text-sm text-[#64748B]">
              {message.content}
            </p>

            {/* Error details */}
            {message.details && (
              <details className="mt-2">
                <summary className="text-xs text-[#EF4444] cursor-pointer hover:underline">
                  View details
                </summary>
                <pre className="mt-2 p-2 bg-red-100/50 rounded text-xs text-red-800 overflow-x-auto">
                  {JSON.stringify(message.details, null, 2)}
                </pre>
              </details>
            )}

            {/* Retry button */}
            {message.onRetry && (
              <button
                onClick={message.onRetry}
                className="mt-2 text-xs text-[#6366F1] hover:text-indigo-600 underline"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Timestamp */}
      {message.timestamp && (
        <div className="text-xs text-[#64748B] mt-1">
          {formatTime(message.timestamp)}
        </div>
      )}
    </div>
  );
}

// ==================== Helper Functions ====================

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}
