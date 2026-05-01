import { useEffect, useRef } from 'react';
import { User, Bot, AlertCircle } from 'lucide-react';
import MarkdownRenderer, { StreamingMarkdown } from './MarkdownRenderer';
import StatusAccordion, { LoadingIndicator } from './StatusAccordion';

/**
 * ChatMessage-Enhanced - 增强版聊天消息组件
 *
 * 支持功能：
 * - Markdown 渲染（代码高亮、一键复制）
 * - 流式文本显示
 * - 工作流状态展示
 * - 多种消息类型
 * - 自动滚动
 */
export default function ChatMessage({ message }) {
  const messageRef = useRef(null);

  // 自动滚动到最新消息
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
 * UserMessage - 用户消息
 */
function UserMessage({ message }) {
  return (
    <div className="flex gap-4 mb-6 justify-end">
      <div className="max-w-[80%] lg:max-w-[70%]">
        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {/* 元数据 */}
        {message.metadata && (
          <div className="text-xs text-gray-500 mt-1 text-right space-x-2">
            {message.metadata.destination && (
              <span>📍 {message.metadata.destination}</span>
            )}
            {message.metadata.dates && (
              <span>📅 {message.metadata.dates}</span>
            )}
          </div>
        )}

        {/* 时间戳 */}
        {message.timestamp && (
          <div className="text-xs text-gray-400 mt-1 text-right">
            {formatTime(message.timestamp)}
          </div>
        )}
      </div>

      {/* 用户头像 */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
}

/**
 * AssistantMessage - AI 助手消息（最终结果）
 */
function AssistantMessage({ message }) {
  return (
    <div className="flex gap-4 mb-6">
      {/* AI 头像 */}
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="flex-1 max-w-[80%] lg:max-w-[70%]">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          {/* Markdown 渲染 */}
          <MarkdownRenderer content={message.content} />

          {/* 元数据 */}
          {message.metadata && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 space-y-1">
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

        {/* 时间戳 */}
        {message.timestamp && (
          <div className="text-xs text-gray-400 mt-1">
            {formatTime(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * StreamingMessage - 流式消息（实时生成中）
 */
function StreamingMessage({ message }) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="flex-1 max-w-[80%] lg:max-w-[70%]">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          {/* 流式 Markdown 渲染 */}
          <StreamingMarkdown
            content={message.content}
            isStreaming={true}
          />
        </div>

        {/* 流式指示 */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
          <LoadingIndicator type="dots" message="AI is generating..." className="bg-transparent border-0 p-0" />
        </div>
      </div>
    </div>
  );
}

/**
 * WorkflowMessage - 工作流消息（包含多个步骤）
 */
function WorkflowMessage({ message }) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="flex-1 max-w-[80%] lg:max-w-[70%]">
        {/* 工作流步骤 */}
        <StatusAccordion
          steps={message.steps}
          isActive={message.status === 'processing'}
        />

        {/* 最终结果（如果有） */}
        {message.result && (
          <div className="mt-4 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
            <MarkdownRenderer content={message.result} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * StatusMessage - 状态消息（居中显示）
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
 * ToolCallMessage - 工具调用消息（紧凑显示）
 */
function ToolCallMessage({ message }) {
  return (
    <div className="flex justify-center mb-4">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full text-sm text-purple-700">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" />
          <span className="font-medium">Tool:</span>
          <code className="bg-purple-100 px-2 py-0.5 rounded text-xs">
            {message.tool}
          </code>
        </div>

        {message.args && message.args.city && (
          <span className="text-purple-600">
            → {message.args.city}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * ErrorMessage - 错误消息
 */
function ErrorMessage({ message }) {
  return (
    <div className="mb-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900 mb-1">
              Error occurred
            </p>
            <p className="text-sm text-red-700">
              {message.content}
            </p>

            {/* 错误详情（如果有） */}
            {message.details && (
              <details className="mt-2">
                <summary className="text-xs text-red-600 cursor-pointer hover:underline">
                  View details
                </summary>
                <pre className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800 overflow-x-auto">
                  {JSON.stringify(message.details, null, 2)}
                </pre>
              </details>
            )}

            {/* 重试按钮（如果支持） */}
            {message.onRetry && (
              <button
                onClick={message.onRetry}
                className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 时间戳 */}
      {message.timestamp && (
        <div className="text-xs text-gray-400 mt-1">
          {formatTime(message.timestamp)}
        </div>
      )}
    </div>
  );
}

// ==================== 辅助函数 ====================

/**
 * 格式化时间戳
 */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();

  // 今天的消息只显示时间
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // 其他日期显示完整时间
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 格式化持续时间
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}
