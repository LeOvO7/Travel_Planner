import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, MapPin, Calendar, Loader2 } from 'lucide-react';

/**
 * ChatInput Component
 * - Auto-resizing textarea
 * - Ctrl/Cmd+Enter shortcut
 * - Duplicate-submission prevention via isSubmitting guard + cooldown
 */
export default function ChatInput({ onSubmit, isLoading }) {
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);
  const lastSubmitTimeRef = useRef(0);

  const MIN_SUBMIT_INTERVAL = 2000; // 2s cooldown between submissions

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Guard: block if already loading or submitting
    if (isLoading || isSubmitting) return;

    // Guard: enforce cooldown between submissions
    const now = Date.now();
    if (now - lastSubmitTimeRef.current < MIN_SUBMIT_INTERVAL) return;

    // Validate
    if (!destination.trim()) return;

    setIsSubmitting(true);

    const data = {
      destination: destination.trim(),
      dates: dates.trim() || 'Not specified',
      message: message.trim()
    };

    try {
      await onSubmit(data);
      lastSubmitTimeRef.current = Date.now();

      // Clear inputs on success
      setDestination('');
      setDates('');
      setMessage('');
    } catch {
      // Parent handles errors; keep inputs so the user can retry
    } finally {
      setIsSubmitting(false);
    }
  }, [destination, dates, message, isLoading, isSubmitting, onSubmit]);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isBusy = isLoading || isSubmitting;
  const isFormValid = destination.trim().length > 0;

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 目的地和日期输入 */}
          <div className="grid md:grid-cols-2 gap-3">
            {/* 目的地 */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Destination (e.g., Tokyo, Paris)"
                disabled={isBusy}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500
                         text-sm"
              />
            </div>

            {/* 旅行日期 */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={dates}
                onChange={(e) => setDates(e.target.value)}
                placeholder="Travel dates (e.g., May 15-20, 2026)"
                disabled={isBusy}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500
                         text-sm"
              />
            </div>
          </div>

          {/* 多行消息输入 */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Additional requirements or questions... (Optional)"
              disabled={isBusy}
              rows={1}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       outline-none transition-all resize-none
                       disabled:bg-gray-50 disabled:text-gray-500
                       text-sm min-h-[44px] max-h-32 overflow-y-auto"
            />

            {/* 发送按钮 */}
            <button
              type="submit"
              disabled={isBusy || !isFormValid}
              className="absolute right-2 bottom-2 p-2 rounded-lg
                       bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300
                       text-white transition-colors group"
              title="Send (Ctrl/Cmd + Enter)"
            >
              {isBusy ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              )}
            </button>
          </div>

          {/* 提示文本 */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {isFormValid
                ? '✓ Ready to plan your trip'
                : '⚠ Destination is required'}
            </span>
            <span className="hidden sm:inline">
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">Ctrl</kbd> +
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300 ml-1">Enter</kbd> to send
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
