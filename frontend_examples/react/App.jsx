import { useState, useEffect, useRef } from 'react';
import { MapPin, Calendar, Loader2, CheckCircle, AlertCircle, WifiOff, RefreshCw } from 'lucide-react';

// ── Network status hook ──
function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      setTimeout(() => setWasOffline(false), 3000);
    };
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}

// ── SSE streaming hook with timeout, error classification, reconnect ──
function useSSE() {
  const [status, setStatus] = useState('');
  const [toolCalls, setToolCalls] = useState([]);
  const [result, setResult] = useState('');
  const [error, setError] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const abortRef = useRef(null);
  const requestTimeoutRef = useRef(null);
  const heartbeatTimeoutRef = useRef(null);
  const lastRequestRef = useRef(null);

  const REQUEST_TIMEOUT = 30000;
  const HEARTBEAT_TIMEOUT = 60000;

  function cleanup() {
    if (requestTimeoutRef.current) { clearTimeout(requestTimeoutRef.current); requestTimeoutRef.current = null; }
    if (heartbeatTimeoutRef.current) { clearTimeout(heartbeatTimeoutRef.current); heartbeatTimeoutRef.current = null; }
  }

  function resetHeartbeat(onTimeout) {
    if (heartbeatTimeoutRef.current) clearTimeout(heartbeatTimeoutRef.current);
    heartbeatTimeoutRef.current = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();
      onTimeout();
    }, HEARTBEAT_TIMEOUT);
  }

  const startStream = async (destination, travelDates) => {
    if (isStreaming) return;

    setStatus('');
    setToolCalls([]);
    setResult('');
    setError(null);
    setIsStreaming(true);

    lastRequestRef.current = { destination, travelDates };
    abortRef.current = new AbortController();

    requestTimeoutRef.current = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();
      cleanup();
      setIsStreaming(false);
      setError({
        title: 'Request Timeout',
        message: `The server did not respond within ${REQUEST_TIMEOUT / 1000} seconds. It may be overloaded or unreachable.`,
        canReconnect: true,
      });
    }, REQUEST_TIMEOUT);

    try {
      const response = await fetch('http://localhost:8000/api/travel/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, travel_dates: travelDates }),
        signal: abortRef.current.signal,
      });

      if (requestTimeoutRef.current) { clearTimeout(requestTimeoutRef.current); requestTimeoutRef.current = null; }

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      resetHeartbeat(() => {
        setIsStreaming(false);
        setError({
          title: 'Connection Lost',
          message: 'The server stopped responding. The connection may have been interrupted.',
          canReconnect: true,
        });
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        resetHeartbeat(() => {
          setIsStreaming(false);
          setError({
            title: 'Connection Lost',
            message: 'The server stopped responding. The connection may have been interrupted.',
            canReconnect: true,
          });
        });

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          const eventMatch = line.match(/^event: (.+)$/m);
          const dataMatch = line.match(/^data: (.+)$/m);

          if (eventMatch && dataMatch) {
            const eventType = eventMatch[1];
            let data;
            try {
              data = JSON.parse(dataMatch[1]);
            } catch (parseErr) {
              setError({
                title: 'Data Error',
                message: `Received malformed data from the server: ${parseErr.message}`,
                canReconnect: false,
              });
              continue;
            }

            switch (eventType) {
              case 'status':
                setStatus(data.message);
                break;
              case 'tool_call':
                setToolCalls(prev => [...prev, { tool: data.tool, args: data.args }]);
                break;
              case 'result':
                setResult(data.content);
                break;
              case 'error':
                setError({
                  title: 'Server Error',
                  message: data.error,
                  canReconnect: true,
                });
                break;
              case 'done':
                setStatus('Travel guide generated successfully!');
                break;
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      const isNetworkError = err instanceof TypeError;
      setError({
        title: isNetworkError ? 'Connection Failed' : 'Error',
        message: isNetworkError
          ? 'Unable to reach the server. Please make sure the backend is running on localhost:8000.'
          : err.message,
        canReconnect: true,
      });
    } finally {
      cleanup();
      setIsStreaming(false);
    }
  };

  const retry = () => {
    if (lastRequestRef.current) {
      startStream(lastRequestRef.current.destination, lastRequestRef.current.travelDates);
    }
  };

  return { status, toolCalls, result, error, isStreaming, startStream, retry };
}

// ── Main App Component ──
function App() {
  const [destination, setDestination] = useState('');
  const [travelDates, setTravelDates] = useState('');
  const { status, toolCalls, result, error, isStreaming, startStream, retry } = useSSE();
  const { isOnline, wasOffline } = useNetworkStatus();
  const lastSubmitRef = useRef(0);

  const MIN_SUBMIT_INTERVAL = 2000;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isStreaming) return;

    const now = Date.now();
    if (now - lastSubmitRef.current < MIN_SUBMIT_INTERVAL) return;

    if (destination.trim() && travelDates.trim()) {
      lastSubmitRef.current = now;
      startStream(destination, travelDates);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Network status banner ── */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#EF4444] text-white px-4 py-3 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <WifiOff className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">No Internet Connection</p>
              <p className="text-sm text-red-100">Please check your network and try again.</p>
            </div>
          </div>
        </div>
      )}
      {isOnline && wasOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#10B981] text-white px-4 py-3 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-semibold">Back Online</p>
          </div>
        </div>
      )}

      <div className={`container mx-auto px-4 py-10 max-w-4xl ${!isOnline ? 'pt-20' : ''}`}>
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-[#0F172A] mb-3">
            Smart Travel Planner
          </h1>
          <p className="text-[#64748B] text-lg">
            AI-powered travel planning with real-time weather insights
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-8 mb-8 hover:shadow-md transition-shadow duration-200">
          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-5 mb-6">
              {/* Destination Input */}
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-2">
                  <MapPin className="inline w-4 h-4 mr-1 text-[#6366F1]" />
                  Destination
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g., Tokyo, Paris, New York"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent outline-none transition-all text-[#0F172A] placeholder:text-[#64748B]"
                  disabled={isStreaming}
                />
              </div>

              {/* Travel Dates Input */}
              <div>
                <label className="block text-sm font-medium text-[#0F172A] mb-2">
                  <Calendar className="inline w-4 h-4 mr-1 text-[#6366F1]" />
                  Travel Dates
                </label>
                <input
                  type="text"
                  value={travelDates}
                  onChange={(e) => setTravelDates(e.target.value)}
                  placeholder="e.g., May 15-20, 2026"
                  className="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent outline-none transition-all text-[#0F172A] placeholder:text-[#64748B]"
                  disabled={isStreaming}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isStreaming || !destination.trim() || !travelDates.trim()}
              className="w-full bg-[#6366F1] hover:bg-indigo-600 active:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center hover:shadow-md"
            >
              {isStreaming ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5 mr-2" />
                  Planning Your Trip...
                </>
              ) : (
                'Generate Travel Guide'
              )}
            </button>
          </form>
        </div>

        {/* Status Display */}
        {status && (
          <div className="bg-indigo-50 border-l-4 border-[#6366F1] p-4 mb-5 rounded-lg">
            <div className="flex items-center">
              <Loader2 className="animate-spin w-5 h-5 text-[#6366F1] mr-3" />
              <p className="text-indigo-700 font-medium">{status}</p>
            </div>
          </div>
        )}

        {/* Tool Calls Display */}
        {toolCalls.length > 0 && (
          <div className="bg-white border border-[#E2E8F0] p-5 mb-5 rounded-xl shadow-sm">
            <h3 className="font-semibold text-[#0F172A] mb-3">AI Actions:</h3>
            {toolCalls.map((call, idx) => (
              <div key={idx} className="text-sm text-[#64748B] mb-1.5 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                <span>
                  Called <code className="bg-indigo-50 text-[#6366F1] px-2 py-0.5 rounded text-xs font-medium">{call.tool}</code>
                  {call.args.city && ` for ${call.args.city}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Error Display ── */}
        {error && (
          <div className="bg-red-50 border-2 border-[#EF4444]/30 p-5 mb-5 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-[#EF4444] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-base font-semibold text-[#0F172A] mb-1">{error.title}</h3>
                <p className="text-sm text-[#64748B] mb-3">{error.message}</p>
                {error.canReconnect && (
                  <button
                    onClick={retry}
                    disabled={isStreaming}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#EF4444] hover:bg-red-600 disabled:bg-slate-300 text-white rounded-lg font-medium transition-all duration-200 text-sm hover:shadow-md"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reconnect
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-8 hover:shadow-md transition-shadow duration-200">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-4 flex items-center">
              <CheckCircle className="w-6 h-6 text-[#10B981] mr-2" />
              Your Travel Guide
            </h2>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-[#0F172A] leading-relaxed">
                {result}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
