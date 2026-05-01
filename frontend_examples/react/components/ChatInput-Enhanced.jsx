import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, MapPin, Calendar, Loader2, AlertCircle } from 'lucide-react';

/**
 * useDebouncedValue - 防抖 Hook
 */
function useDebouncedValue(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * ChatInput-Enhanced - 增强版输入框
 *
 * 新增功能：
 * - 防抖处理
 * - 防重复提交
 * - 提交冷却时间
 * - 输入验证
 * - 字符计数
 * - 错误提示
 */
export default function ChatInputEnhanced({
  onSubmit,
  isLoading = false,
  minCooldown = 2000, // 最小提交间隔（毫秒）
  maxLength = 1000,   // 最大输入长度
  required = ['destination'], // 必填字段
}) {
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [submitCount, setSubmitCount] = useState(0);

  const textareaRef = useRef(null);
  const lastSubmitTimeRef = useRef(0);
  const cooldownIntervalRef = useRef(null);

  // 防抖的输入值（用于验证）
  const debouncedDestination = useDebouncedValue(destination, 300);
  const debouncedMessage = useDebouncedValue(message, 300);

  // 自动调整 textarea 高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // 验证输入
  useEffect(() => {
    const newErrors = {};

    if (required.includes('destination') && debouncedDestination && debouncedDestination.length < 2) {
      newErrors.destination = 'Destination must be at least 2 characters';
    }

    if (debouncedMessage.length > maxLength) {
      newErrors.message = `Message must not exceed ${maxLength} characters`;
    }

    setErrors(newErrors);
  }, [debouncedDestination, debouncedMessage, required, maxLength]);

  // 检查冷却时间
  const checkCooldown = useCallback(() => {
    const now = Date.now();
    const timeSinceLastSubmit = now - lastSubmitTimeRef.current;

    if (timeSinceLastSubmit < minCooldown) {
      const remaining = minCooldown - timeSinceLastSubmit;
      setCooldownRemaining(remaining);

      // 启动倒计时
      if (!cooldownIntervalRef.current) {
        cooldownIntervalRef.current = setInterval(() => {
          const newRemaining = minCooldown - (Date.now() - lastSubmitTimeRef.current);
          if (newRemaining <= 0) {
            setCooldownRemaining(0);
            clearInterval(cooldownIntervalRef.current);
            cooldownIntervalRef.current = null;
          } else {
            setCooldownRemaining(newRemaining);
          }
        }, 100);
      }

      return false;
    }

    return true;
  }, [minCooldown]);

  // 验证表单
  const validate = useCallback(() => {
    const validationErrors = {};

    // 检查必填字段
    if (required.includes('destination') && !destination.trim()) {
      validationErrors.destination = 'Destination is required';
    }

    if (required.includes('dates') && !dates.trim()) {
      validationErrors.dates = 'Travel dates are required';
    }

    // 检查长度
    if (destination.length < 2) {
      validationErrors.destination = 'Destination too short';
    }

    if (message.length > maxLength) {
      validationErrors.message = `Exceeds maximum length (${maxLength})`;
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [destination, dates, message, required, maxLength]);

  // 处理提交
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // 防止重复提交
    if (isLoading || isSubmitting) {
      console.warn('Submit already in progress');
      return;
    }

    // 检查冷却时间
    if (!checkCooldown()) {
      console.warn(`Please wait ${Math.ceil(cooldownRemaining / 1000)}s before submitting again`);
      return;
    }

    // 验证输入
    if (!validate()) {
      console.warn('Validation failed', errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const data = {
        destination: destination.trim(),
        dates: dates.trim() || 'Not specified',
        message: message.trim(),
      };

      await onSubmit(data);

      // 记录提交时间
      lastSubmitTimeRef.current = Date.now();
      setSubmitCount(prev => prev + 1);

      // 清空输入
      setDestination('');
      setDates('');
      setMessage('');
      setErrors({});

    } catch (error) {
      console.error('Submit error:', error);
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  }, [destination, dates, message, isLoading, isSubmitting, cooldownRemaining, checkCooldown, validate, onSubmit]);

  // 快捷键
  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter 发送
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  const isFormValid = destination.trim().length >= 2 && Object.keys(errors).length === 0;
  const canSubmit = isFormValid && !isLoading && !isSubmitting && cooldownRemaining === 0;

  return (
    <div className="border-t border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 目的地和日期输入 */}
          <div className="grid md:grid-cols-2 gap-3">
            {/* 目的地 */}
            <div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Destination (e.g., Tokyo, Paris)"
                  disabled={isLoading || isSubmitting}
                  className={`
                    w-full pl-10 pr-4 py-2.5 border rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500
                    text-sm
                    ${errors.destination ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                  `}
                />
              </div>
              {errors.destination && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.destination}
                </p>
              )}
            </div>

            {/* 旅行日期 */}
            <div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={dates}
                  onChange={(e) => setDates(e.target.value)}
                  placeholder="Travel dates (e.g., May 15-20, 2026)"
                  disabled={isLoading || isSubmitting}
                  className={`
                    w-full pl-10 pr-4 py-2.5 border rounded-lg
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    outline-none transition-all disabled:bg-gray-50 disabled:text-gray-500
                    text-sm
                    ${errors.dates ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                  `}
                />
              </div>
              {errors.dates && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.dates}
                </p>
              )}
            </div>
          </div>

          {/* 多行消息输入 */}
          <div>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Additional requirements or questions... (Optional)"
                disabled={isLoading || isSubmitting}
                rows={1}
                maxLength={maxLength}
                className={`
                  w-full px-4 py-3 pr-12 border rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  outline-none transition-all resize-none
                  disabled:bg-gray-50 disabled:text-gray-500
                  text-sm min-h-[44px] max-h-32 overflow-y-auto
                  ${errors.message ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                `}
              />

              {/* 发送按钮 */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="absolute right-2 bottom-2 p-2 rounded-lg
                         bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300
                         text-white transition-colors group"
                title={
                  cooldownRemaining > 0
                    ? `Please wait ${Math.ceil(cooldownRemaining / 1000)}s`
                    : canSubmit
                    ? 'Send (Ctrl/Cmd + Enter)'
                    : 'Fill in required fields'
                }
              >
                {isLoading || isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                )}
              </button>
            </div>

            {/* 字符计数 */}
            {message.length > 0 && (
              <div className="flex justify-between items-center mt-1 text-xs">
                <span className={message.length > maxLength ? 'text-red-600' : 'text-gray-500'}>
                  {message.length} / {maxLength} characters
                </span>
              </div>
            )}

            {errors.message && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.message}
              </p>
            )}
          </div>

          {/* 提示文本 */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-2">
              {isFormValid ? (
                <span className="text-green-600">✓ Ready to send</span>
              ) : (
                <span className="text-amber-600">⚠ Fill in destination</span>
              )}

              {cooldownRemaining > 0 && (
                <span className="text-amber-600">
                  • Cooldown: {Math.ceil(cooldownRemaining / 1000)}s
                </span>
              )}

              {submitCount > 0 && (
                <span className="text-gray-400">
                  • Sent: {submitCount}
                </span>
              )}
            </div>

            <span className="hidden sm:inline">
              Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">Ctrl</kbd> +
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300 ml-1">Enter</kbd> to send
            </span>
          </div>

          {/* 提交错误 */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {errors.submit}
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
