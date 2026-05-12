import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, MapPin, Calendar, Loader2, AlertCircle } from 'lucide-react';

/**
 * useDebouncedValue
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
 * ChatInput-Enhanced
 */
export default function ChatInputEnhanced({
  onSubmit,
  isLoading = false,
  minCooldown = 2000,
  maxLength = 1000,
  required = ['destination'],
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

  const debouncedDestination = useDebouncedValue(destination, 300);
  const debouncedMessage = useDebouncedValue(message, 300);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Validate inputs
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

  // Check cooldown
  const checkCooldown = useCallback(() => {
    const now = Date.now();
    const timeSinceLastSubmit = now - lastSubmitTimeRef.current;

    if (timeSinceLastSubmit < minCooldown) {
      const remaining = minCooldown - timeSinceLastSubmit;
      setCooldownRemaining(remaining);

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

  // Validate form
  const validate = useCallback(() => {
    const validationErrors = {};

    if (required.includes('destination') && !destination.trim()) {
      validationErrors.destination = 'Destination is required';
    }

    if (required.includes('dates') && !dates.trim()) {
      validationErrors.dates = 'Travel dates are required';
    }

    if (destination.length < 2) {
      validationErrors.destination = 'Destination too short';
    }

    if (message.length > maxLength) {
      validationErrors.message = `Exceeds maximum length (${maxLength})`;
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [destination, dates, message, required, maxLength]);

  // Handle submit
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (isLoading || isSubmitting) {
      console.warn('Submit already in progress');
      return;
    }

    if (!checkCooldown()) {
      console.warn(`Please wait ${Math.ceil(cooldownRemaining / 1000)}s before submitting again`);
      return;
    }

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

      lastSubmitTimeRef.current = Date.now();
      setSubmitCount(prev => prev + 1);

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

  // Keyboard shortcut
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Cleanup timers
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
    <div className="border-t border-[#E2E8F0] bg-white">
      <div className="max-w-4xl mx-auto p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Destination and dates inputs */}
          <div className="grid md:grid-cols-2 gap-3">
            {/* Destination */}
            <div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Destination (e.g., Tokyo, Paris)"
                  disabled={isLoading || isSubmitting}
                  className={`
                    w-full pl-10 pr-4 py-2.5 border rounded-lg
                    focus:ring-2 focus:ring-[#6366F1] focus:border-transparent
                    outline-none transition-all disabled:bg-slate-50 disabled:text-[#64748B]
                    text-sm text-[#0F172A] placeholder:text-[#64748B]
                    ${errors.destination ? 'border-[#EF4444]/50 bg-red-50' : 'border-[#E2E8F0]'}
                  `}
                />
              </div>
              {errors.destination && (
                <p className="text-xs text-[#EF4444] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.destination}
                </p>
              )}
            </div>

            {/* Travel dates */}
            <div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                <input
                  type="text"
                  value={dates}
                  onChange={(e) => setDates(e.target.value)}
                  placeholder="Travel dates (e.g., May 15-20, 2026)"
                  disabled={isLoading || isSubmitting}
                  className={`
                    w-full pl-10 pr-4 py-2.5 border rounded-lg
                    focus:ring-2 focus:ring-[#6366F1] focus:border-transparent
                    outline-none transition-all disabled:bg-slate-50 disabled:text-[#64748B]
                    text-sm text-[#0F172A] placeholder:text-[#64748B]
                    ${errors.dates ? 'border-[#EF4444]/50 bg-red-50' : 'border-[#E2E8F0]'}
                  `}
                />
              </div>
              {errors.dates && (
                <p className="text-xs text-[#EF4444] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.dates}
                </p>
              )}
            </div>
          </div>

          {/* Textarea message input */}
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
                  focus:ring-2 focus:ring-[#6366F1] focus:border-transparent
                  outline-none transition-all resize-none
                  disabled:bg-slate-50 disabled:text-[#64748B]
                  text-sm text-[#0F172A] placeholder:text-[#64748B] min-h-[44px] max-h-32 overflow-y-auto
                  ${errors.message ? 'border-[#EF4444]/50 bg-red-50' : 'border-[#E2E8F0]'}
                `}
              />

              {/* Send button */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="absolute right-2 bottom-2 p-2 rounded-lg
                         bg-[#6366F1] hover:bg-indigo-600 active:bg-indigo-700 disabled:bg-slate-300
                         text-white transition-all duration-200 group hover:shadow-md"
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

            {/* Character count */}
            {message.length > 0 && (
              <div className="flex justify-between items-center mt-1 text-xs">
                <span className={message.length > maxLength ? 'text-[#EF4444]' : 'text-[#64748B]'}>
                  {message.length} / {maxLength} characters
                </span>
              </div>
            )}

            {errors.message && (
              <p className="text-xs text-[#EF4444] mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.message}
              </p>
            )}
          </div>

          {/* Hint text */}
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <div className="flex items-center gap-2">
              {isFormValid ? (
                <span className="text-[#10B981]">✓ Ready to send</span>
              ) : (
                <span className="text-[#F59E0B]">⚠ Fill in destination</span>
              )}

              {cooldownRemaining > 0 && (
                <span className="text-[#F59E0B]">
                  • Cooldown: {Math.ceil(cooldownRemaining / 1000)}s
                </span>
              )}

              {submitCount > 0 && (
                <span className="text-[#64748B]">
                  • Sent: {submitCount}
                </span>
              )}
            </div>

            <span className="hidden sm:inline">
              Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-[#E2E8F0]">Ctrl</kbd> +
              <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-[#E2E8F0] ml-1">Enter</kbd> to send
            </span>
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-[#EF4444]/30 rounded-lg">
              <p className="text-sm text-[#EF4444] flex items-center gap-2">
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
