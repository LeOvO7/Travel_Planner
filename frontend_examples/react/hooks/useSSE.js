import { useState, useRef, useCallback } from 'react';

/**
 * useSSE - Server-Sent Events Hook
 *
 * Features:
 * - Request timeout detection
 * - Heartbeat (inactivity) timeout during streaming
 * - Error classification (network / timeout / server)
 * - Auto-reconnect with configurable attempts
 * - Manual reconnect / disconnect
 * - Connection state management
 *
 * @param {string} url - SSE endpoint URL
 * @param {object} options - Configuration
 * @returns {object} SSE state and methods
 */
export function useSSE(url, options = {}) {
  const {
    onMessage = () => {},
    onError = () => {},
    onOpen = () => {},
    onClose = () => {},
    onTimeout = () => {},
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 3,
    timeout = 30000,           // 30s request timeout
    heartbeatTimeout = 60000,  // 60s inactivity timeout
  } = options;

  const [connectionState, setConnectionState] = useState('idle'); // idle | connecting | connected | disconnected | error
  const [reconnectCount, setReconnectCount] = useState(0);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const requestTimeoutRef = useRef(null);
  const heartbeatTimeoutRef = useRef(null);
  const lastRequestDataRef = useRef(null);

  /**
   * Build a classified error object
   */
  const buildError = (type, message, original = null) => ({
    type,
    message,
    originalError: original,
    timestamp: Date.now(),
  });

  /**
   * Reset the heartbeat timer (called on every received chunk)
   */
  const resetHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }

    heartbeatTimeoutRef.current = setTimeout(() => {
      const err = buildError('HEARTBEAT_TIMEOUT', 'No response from server — connection may be lost.');
      setError(err);
      setConnectionState('error');
      onTimeout(err);
      // Abort the current stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, heartbeatTimeout);
  }, [heartbeatTimeout, onTimeout]);

  /**
   * Parse a single SSE event block
   */
  const parseEvent = (eventText) => {
    const lines = eventText.split('\n');
    const event = { type: 'message', data: null, id: null, retry: null };

    for (const line of lines) {
      if (line.startsWith('event:')) {
        event.type = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        const dataStr = line.substring(5).trim();
        try {
          event.data = JSON.parse(dataStr);
        } catch {
          event.data = dataStr;
        }
      } else if (line.startsWith('id:')) {
        event.id = line.substring(3).trim();
      } else if (line.startsWith('retry:')) {
        event.retry = parseInt(line.substring(6).trim(), 10);
      }
    }

    return event.data ? event : null;
  };

  /**
   * Read and parse the SSE response stream
   */
  const parseSSEStream = useCallback(async (response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // Clear request timeout — we got a response
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
      requestTimeoutRef.current = null;
    }

    // Start heartbeat monitoring
    resetHeartbeat();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          setConnectionState('disconnected');
          onClose();
          break;
        }

        // Reset heartbeat on every chunk
        resetHeartbeat();

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const eventText of events) {
          if (!eventText.trim()) continue;
          const event = parseEvent(eventText);
          if (event) {
            onMessage(event);
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        const errorInfo = buildError('STREAM_ERROR', err.message, err);
        console.error('SSE Stream Error:', errorInfo);
        setConnectionState('error');
        setError(errorInfo);
        onError(errorInfo);

        if (autoReconnect && reconnectCount < maxReconnectAttempts) {
          scheduleReconnect();
        }
      }
    } finally {
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
        heartbeatTimeoutRef.current = null;
      }
    }
  }, [onMessage, onError, onClose, autoReconnect, reconnectCount, maxReconnectAttempts, resetHeartbeat]);

  /**
   * Schedule an automatic reconnect attempt
   */
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    setConnectionState('connecting');
    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectCount(prev => prev + 1);
      const data = lastRequestDataRef.current;
      if (data) {
        connect(data);
      }
    }, reconnectInterval);
  }, [reconnectInterval]);

  /**
   * Initiate an SSE connection
   */
  const connect = useCallback(async (requestData = {}) => {
    // Cancel any previous connection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Clear all timers
    if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);
    if (heartbeatTimeoutRef.current) clearTimeout(heartbeatTimeoutRef.current);

    abortControllerRef.current = new AbortController();
    lastRequestDataRef.current = requestData;
    setConnectionState('connecting');
    setReconnectCount(0);
    setError(null);

    // Request-level timeout
    requestTimeoutRef.current = setTimeout(() => {
      const err = buildError('REQUEST_TIMEOUT', `Request timed out after ${timeout / 1000}s. The server may be unreachable.`);
      setError(err);
      setConnectionState('error');
      onTimeout(err);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(requestData),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setConnectionState('connected');
      onOpen();

      await parseSSEStream(response);

    } catch (err) {
      if (err.name !== 'AbortError') {
        const isNetworkError = err instanceof TypeError;
        const errorInfo = buildError(
          isNetworkError ? 'NETWORK_ERROR' : 'CONNECTION_ERROR',
          isNetworkError
            ? 'Unable to reach the server. Please make sure the backend is running.'
            : err.message,
          err
        );

        console.error('SSE Connection Error:', errorInfo);
        setConnectionState('error');
        setError(errorInfo);
        onError(errorInfo);

        if (autoReconnect && reconnectCount < maxReconnectAttempts) {
          scheduleReconnect();
        }
      }
    } finally {
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
        requestTimeoutRef.current = null;
      }
    }
  }, [url, timeout, onOpen, onError, onTimeout, parseSSEStream, autoReconnect, reconnectCount, maxReconnectAttempts, scheduleReconnect]);

  /**
   * Disconnect and clean up
   */
  const disconnect = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
      requestTimeoutRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
    setConnectionState('disconnected');
    setReconnectCount(0);
  }, []);

  /**
   * Manually retry the last request
   */
  const retry = useCallback(() => {
    const data = lastRequestDataRef.current;
    if (data) {
      connect(data);
    }
  }, [connect]);

  return {
    connect,
    disconnect,
    retry,
    connectionState,
    reconnectCount,
    error,
    isConnecting: connectionState === 'connecting',
    isConnected: connectionState === 'connected',
    isDisconnected: connectionState === 'disconnected',
    isError: connectionState === 'error',
  };
}

/**
 * useStreamingChat - Higher-level hook for chat-style streaming
 * Built on top of useSSE with message management
 */
export function useStreamingChat(apiUrl) {
  const [messages, setMessages] = useState([]);
  const [currentStream, setCurrentStream] = useState(null);
  const [streamingStatus, setStreamingStatus] = useState(null);

  const handleMessage = useCallback((event) => {
    const { type, data } = event;

    switch (type) {
      case 'status':
        setStreamingStatus({
          type: 'status',
          message: data.message,
          timestamp: Date.now(),
        });
        break;

      case 'tool_call':
        setMessages(prev => [...prev, {
          id: `tool_${Date.now()}`,
          type: 'tool_call',
          tool: data.tool,
          args: data.args,
          timestamp: Date.now(),
        }]);
        break;

      case 'chunk':
        setCurrentStream(prev => ({
          content: (prev?.content || '') + data.content,
          timestamp: Date.now(),
        }));
        break;

      case 'result':
        setMessages(prev => [...prev, {
          id: `result_${Date.now()}`,
          type: 'assistant',
          content: data.content,
          metadata: data.metadata,
          timestamp: Date.now(),
        }]);
        setCurrentStream(null);
        setStreamingStatus(null);
        break;

      case 'error':
        setMessages(prev => [...prev, {
          id: `error_${Date.now()}`,
          type: 'error',
          content: data.error,
          timestamp: Date.now(),
        }]);
        setStreamingStatus(null);
        break;

      case 'done':
        setStreamingStatus({
          type: 'done',
          message: data.message || 'Completed',
          timestamp: Date.now(),
        });
        setTimeout(() => setStreamingStatus(null), 2000);
        break;

      default:
        console.warn('Unknown event type:', type, data);
    }
  }, []);

  const handleError = useCallback((errorInfo) => {
    setMessages(prev => [...prev, {
      id: `error_${Date.now()}`,
      type: 'error',
      content: errorInfo.message,
      errorType: errorInfo.type,
      timestamp: Date.now(),
    }]);
    setStreamingStatus(null);
  }, []);

  const handleTimeout = useCallback((errorInfo) => {
    setMessages(prev => [...prev, {
      id: `timeout_${Date.now()}`,
      type: 'error',
      content: errorInfo.message,
      errorType: errorInfo.type,
      isTimeout: true,
      timestamp: Date.now(),
    }]);
    setStreamingStatus(null);
  }, []);

  const {
    connect,
    disconnect,
    retry,
    connectionState,
    error,
    isConnecting,
  } = useSSE(apiUrl, {
    onMessage: handleMessage,
    onError: handleError,
    onTimeout: handleTimeout,
    autoReconnect: false, // Chat context: let the user decide to reconnect
  });

  const sendMessage = useCallback(async (userMessage, requestData) => {
    const userMsg = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: userMessage,
      metadata: requestData,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    await connect(requestData);
  }, [connect]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentStream(null);
    setStreamingStatus(null);
  }, []);

  return {
    messages,
    currentStream,
    streamingStatus,
    connectionState,
    error,
    isStreaming: isConnecting || connectionState === 'connected',
    sendMessage,
    clearMessages,
    disconnect,
    retry,
  };
}
