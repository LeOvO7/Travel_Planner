import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, MapPin, Calendar, Loader2, Navigation } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

/**
 * ChatInput Component
 * - Departure + Destination text inputs (no placeholder)
 * - react-datepicker calendar for start/end date (English, 5-year range)
 * - Auto-resizing textarea for additional notes
 * - Ctrl/Cmd+Enter shortcut
 * - Duplicate-submission prevention via isSubmitting guard + cooldown
 * - After initial input, only shows the message textarea
 */
export default function ChatInput({ onSubmit, isLoading, hasInitialInput = false }) {
  const [departure, setDeparture] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);
  const lastSubmitTimeRef = useRef(0);

  const MIN_SUBMIT_INTERVAL = 2000;

  // Date boundaries: today → 5 years from now
  const minDate = useMemo(() => new Date(), []);
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    return d;
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const formatDateRange = useCallback((start, end) => {
    if (!start && !end) return 'Not specified';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const fmt = (d) => d.toLocaleDateString('en-US', options);
    if (start && end) return `${fmt(start)} - ${fmt(end)}`;
    if (start) return fmt(start);
    return fmt(end);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (isLoading || isSubmitting) return;

    const now = Date.now();
    if (now - lastSubmitTimeRef.current < MIN_SUBMIT_INTERVAL) return;

    // After initial input, only message is required
    if (hasInitialInput) {
      if (!message.trim()) return;
    } else {
      if (!destination.trim()) return;
    }

    setIsSubmitting(true);

    const data = {
      departure: departure.trim(),
      destination: destination.trim(),
      dates: formatDateRange(startDate, endDate),
      message: message.trim()
    };

    try {
      await onSubmit(data);
      lastSubmitTimeRef.current = Date.now();

      setDeparture('');
      setDestination('');
      setStartDate(null);
      setEndDate(null);
      setMessage('');
    } catch {
      // Parent handles errors; keep inputs so the user can retry
    } finally {
      setIsSubmitting(false);
    }
  }, [departure, destination, startDate, endDate, message, isLoading, isSubmitting, onSubmit, formatDateRange, hasInitialInput]);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isBusy = isLoading || isSubmitting;
  const isFormValid = hasInitialInput
    ? message.trim().length > 0
    : destination.trim().length > 0;

  const dateInputClass =
    'w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 border border-[#E2E8F0] rounded-lg ' +
    'focus:ring-2 focus:ring-[#6366F1] focus:border-transparent ' +
    'outline-none transition-all disabled:bg-slate-50 disabled:text-[#64748B] ' +
    'text-sm text-[#0F172A]';

  return (
    <div className="border-t border-[#E2E8F0] bg-white">
      <div className="max-w-4xl mx-auto p-3 md:p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Departure and Destination inputs - Hidden after initial input */}
          {!hasInitialInput && (
            <div className="grid md:grid-cols-2 gap-2 md:gap-3">
              {/* Departure */}
              <div>
                <label className="block text-[10px] md:text-xs font-medium text-[#64748B] mb-0.5 md:mb-1">Departure</label>
                <div className="relative">
                  <Navigation className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-[#64748B] pointer-events-none" />
                  <input
                    type="text"
                    value={departure}
                    onChange={(e) => setDeparture(e.target.value)}
                    disabled={isBusy}
                    className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 border border-[#E2E8F0] rounded-lg
                             focus:ring-2 focus:ring-[#6366F1] focus:border-transparent
                             outline-none transition-all disabled:bg-slate-50 disabled:text-[#64748B]
                             text-sm text-[#0F172A]"
                  />
                </div>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-[10px] md:text-xs font-medium text-[#64748B] mb-0.5 md:mb-1">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-[#64748B] pointer-events-none" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    disabled={isBusy}
                    className="w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2 md:py-2.5 border border-[#E2E8F0] rounded-lg
                             focus:ring-2 focus:ring-[#6366F1] focus:border-transparent
                             outline-none transition-all disabled:bg-slate-50 disabled:text-[#64748B]
                             text-sm text-[#0F172A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Date range inputs - Hidden after initial input */}
          {!hasInitialInput && (
            <div className="grid md:grid-cols-2 gap-2 md:gap-3">
              {/* Start Date */}
              <div>
                <label className="block text-[10px] md:text-xs font-medium text-[#64748B] mb-0.5 md:mb-1">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-[#64748B] pointer-events-none z-10" />
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => {
                      setStartDate(date);
                      if (endDate && date > endDate) setEndDate(null);
                    }}
                    minDate={minDate}
                    maxDate={maxDate}
                    dateFormat="MM/dd/yyyy"
                    disabled={isBusy}
                    className={dateInputClass}
                    wrapperClassName="w-full"
                  />
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[10px] md:text-xs font-medium text-[#64748B] mb-0.5 md:mb-1">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-[#64748B] pointer-events-none z-10" />
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    minDate={startDate || minDate}
                    maxDate={maxDate}
                    dateFormat="MM/dd/yyyy"
                    disabled={isBusy}
                    className={dateInputClass}
                    wrapperClassName="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Textarea message input */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasInitialInput ? "" : "Additional requirements or questions... (Optional)"}
              disabled={isBusy}
              rows={1}
              className="w-full px-4 py-3 pr-12 border border-[#E2E8F0] rounded-lg
                       focus:ring-2 focus:ring-[#6366F1] focus:border-transparent
                       outline-none transition-all resize-none
                       disabled:bg-slate-50 disabled:text-[#64748B]
                       text-sm text-[#0F172A] placeholder:text-[#94A3B8] min-h-[44px] max-h-32 overflow-y-auto"
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={isBusy || !isFormValid}
              className="absolute right-2 bottom-2 p-2 rounded-lg
                       bg-[#6366F1] hover:bg-indigo-600 active:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed
                       text-white transition-all duration-200 group hover:shadow-md"
              title="Send (Ctrl/Cmd + Enter)"
            >
              {isBusy ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              )}
            </button>
          </div>

          {/* Hint text */}
          <div className="flex items-center justify-between text-xs text-[#64748B]">
            <span>
              {hasInitialInput ? (
                isFormValid ? '✓ Ready to send' : '⚠ Message cannot be empty'
              ) : (
                isFormValid ? '✓ Ready to plan your trip' : '⚠ Destination is required'
              )}
            </span>
            <span className="hidden sm:inline">
              Press <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-[#E2E8F0]">Ctrl</kbd> +
              <kbd className="px-1.5 py-0.5 bg-slate-100 rounded border border-[#E2E8F0] ml-1">Enter</kbd> to send
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
