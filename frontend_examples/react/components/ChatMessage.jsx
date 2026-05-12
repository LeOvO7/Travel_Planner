import { User, Bot, Loader2, CheckCircle, Wrench, AlertCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';

/**
 * ChatMessage Component
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

// User message
function UserMessage({ message }) {
  return (
    <div className="flex gap-4 mb-6 justify-end">
      <div className="max-w-[80%] lg:max-w-[70%]">
        <div className="bg-[#6366F1] text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        {message.metadata && (
          <div className="text-xs text-[#64748B] mt-1.5 text-right">
            {message.metadata.destination && `📍 ${message.metadata.destination}`}
            {message.metadata.dates && ` • 📅 ${message.metadata.dates}`}
          </div>
        )}
      </div>
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center shadow-sm">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
}

// AI assistant message
function AssistantMessage({ message }) {
  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center shadow-sm">
          <Bot className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="flex-1 max-w-[80%] lg:max-w-[70%]">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-[#0F172A] text-sm leading-relaxed">
              {message.content}
            </pre>
          </div>
        </div>
        {message.isStreaming && (
          <div className="flex items-center gap-2 text-xs text-[#64748B] mt-2">
            <Loader2 className="w-3 h-3 animate-spin text-[#6366F1]" />
            <span>AI is thinking...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Status message
function StatusMessage({ message }) {
  return (
    <div className="flex justify-center mb-4">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-sm text-indigo-700">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{message.content}</span>
      </div>
    </div>
  );
}

// Tool call message
function ToolCallMessage({ message }) {
  return (
    <div className="flex justify-center mb-4">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-[#E2E8F0] rounded-full text-sm text-[#0F172A]">
        <CheckCircle className="w-4 h-4 text-[#10B981]" />
        <Wrench className="w-3 h-3 text-[#64748B]" />
        <span>
          Called <code className="bg-indigo-50 text-[#6366F1] px-2 py-0.5 rounded text-xs font-medium">{message.tool}</code>
          {message.args?.city && ` for ${message.args.city}`}
        </span>
      </div>
    </div>
  );
}

// Error message
function ErrorMessage({ message }) {
  return (
    <div className="mb-4">
      <div className="bg-red-50 border border-[#EF4444]/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#0F172A] mb-1">Error occurred</p>
            <p className="text-sm text-[#64748B]">{message.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
