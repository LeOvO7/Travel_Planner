import { User, Bot, Loader2, CheckCircle, Wrench, AlertCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';

/**
 * ChatMessage Component - 聊天消息组件
 * 支持用户消息、AI消息、状态消息、工具调用等多种类型
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

// 用户消息
function UserMessage({ message }) {
  return (
    <div className="flex gap-4 mb-6 justify-end">
      <div className="max-w-[80%] lg:max-w-[70%]">
        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        {message.metadata && (
          <div className="text-xs text-gray-500 mt-1 text-right">
            {message.metadata.destination && `📍 ${message.metadata.destination}`}
            {message.metadata.dates && ` • 📅 ${message.metadata.dates}`}
          </div>
        )}
      </div>
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
}

// AI 助手消息
function AssistantMessage({ message }) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="flex-1 max-w-[80%] lg:max-w-[70%]">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-800 text-sm leading-relaxed">
              {message.content}
            </pre>
          </div>
        </div>
        {message.isStreaming && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>AI is thinking...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// 状态消息
function StatusMessage({ message }) {
  return (
    <div className="flex justify-center mb-4">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{message.content}</span>
      </div>
    </div>
  );
}

// 工具调用消息
function ToolCallMessage({ message }) {
  return (
    <div className="flex justify-center mb-4">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full text-sm text-purple-700">
        <CheckCircle className="w-4 h-4" />
        <Wrench className="w-3 h-3" />
        <span>
          Called <code className="bg-purple-100 px-2 py-0.5 rounded text-xs">{message.tool}</code>
          {message.args?.city && ` for ${message.args.city}`}
        </span>
      </div>
    </div>
  );
}

// 错误消息
function ErrorMessage({ message }) {
  return (
    <div className="mb-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900 mb-1">Error occurred</p>
            <p className="text-sm text-red-700">{message.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
