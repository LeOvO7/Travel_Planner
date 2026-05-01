import { useState, useRef, useCallback } from 'react';

/**
 * useSSE-Enhanced - 增强版 SSE Hook
 *
 * 新增功能：
 * - 超时检测
 * - 详细错误信息
 * - 最后活动时间追踪
 * - 更好的错误分类
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
    timeout = 30000, // 30秒超时
    heartbeatTimeout = 60000, // 60秒心跳超时
  } = options;

  const [connectionState, setConnectionState] = useState('idle');
  const [reconnectCount, setReconnectCount] = useState(0);
  const [lastActivity, setLastActivity] = useState(null);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const requestTimeoutRef = useRef(null);
  const heartbeatTimeoutRef = useRef(null);

  /**
   * 重置心跳定时器
   */
  const resetHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }

    heartbeatTimeoutRef.current = setTimeout(() => {
      console.warn('No activity detected for', heartbeatTimeout, 'ms');
      const timeoutError = {
        type: 'HEARTBEAT_TIMEOUT',
        message: 'No response from server',
        timestamp: Date.now(),
      };
      setError(timeoutError);
      onTimeout(timeoutError);
      disconnect();
    }, heartbeatTimeout);

    setLastActivity(Date.now());
  }, [heartbeatTimeout, onTimeout]);

  /**
   * 解析 SSE 事件
   */
  const parseEvent = (eventText) => {
    const lines = eventText.split('\n');
    const event = {
      type: 'message',
      data: null,
      id: null,
      retry: null,
    };

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
   * 解析 SSE 流
   */
  const parseSSEStream = useCallback(async (response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // 清除请求超时
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
      requestTimeoutRef.current = null;
    }

    // 开始心跳监控
    resetHeartbeat();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          setConnectionState('disconnected');
          onClose();
          break;
        }

        // 重置心跳
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
        const errorInfo = {
          type: 'STREAM_ERROR',
          message: err.message,
          originalError: err,
          timestamp: Date.now(),
        };

        console.error('SSE Stream Error:', errorInfo);
        setConnectionState('error');
        setError(errorInfo);
        onError(errorInfo);

        if (autoReconnect && reconnectCount < maxReconnectAttempts) {
          scheduleReconnect();
        }
      }
    } finally {
      // 清理心跳定时器
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }
    }
  }, [onMessage, onError, onClose, autoReconnect, reconnectCount, maxReconnectAttempts, resetHeartbeat]);

  /**
   * 安排重连
   */
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectCount(prev => prev + 1);
      console.log(`Reconnecting... (${reconnectCount + 1}/${maxReconnectAttempts})`);
    }, reconnectInterval);
  }, [reconnectCount, reconnectInterval, maxReconnectAttempts]);

  /**
   * 建立 SSE 连接
   */
  const connect = useCallback(async (requestData = {}) => {
    // 取消之前的连接
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 清除所有定时器
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }

    abortControllerRef.current = new AbortController();
    setConnectionState('connecting');
    setReconnectCount(0);
    setError(null);

    // 设置请求超时
    requestTimeoutRef.current = setTimeout(() => {
      const timeoutError = {
        type: 'REQUEST_TIMEOUT',
        message: `Request timeout after ${timeout}ms`,
        timeout,
        timestamp: Date.now(),
      };

      console.error('Request timeout:', timeoutError);
      setError(timeoutError);
      onTimeout(timeoutError);

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
        const errorInfo = {
          type: err.name === 'TypeError' ? 'NETWORK_ERROR' : 'CONNECTION_ERROR',
          message: err.message,
          originalError: err,
          timestamp: Date.now(),
        };

        console.error('SSE Connection Error:', errorInfo);
        setConnectionState('error');
        setError(errorInfo);
        onError(errorInfo);

        if (autoReconnect && reconnectCount < maxReconnectAttempts) {
          scheduleReconnect();
        }
      }
    } finally {
      // 清除请求超时
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
        requestTimeoutRef.current = null;
      }
    }
  }, [url, timeout, onOpen, onError, onTimeout, parseSSEStream, autoReconnect, reconnectCount, maxReconnectAttempts, scheduleReconnect]);

  /**
   * 断开连接
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

  return {
    connect,
    disconnect,
    connectionState,
    reconnectCount,
    lastActivity,
    error,
    isConnecting: connectionState === 'connecting',
    isConnected: connectionState === 'connected',
    isDisconnected: connectionState === 'disconnected',
    isError: connectionState === 'error',
  };
}

/**
 * useStreamingChat-Enhanced - 增强版流式聊天 Hook
 */
export function useStreamingChat(apiUrl, options = {}) {
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
    }
  }, []);

  const handleError = useCallback((error) => {
    setMessages(prev => [...prev, {
      id: `error_${Date.now()}`,
      type: 'error',
      content: error.message,
      errorDetails: error,
      timestamp: Date.now(),
    }]);
    setStreamingStatus(null);
  }, []);

  const handleTimeout = useCallback((error) => {
    setMessages(prev => [...prev, {
      id: `timeout_${Date.now()}`,
      type: 'error',
      content: `Request timeout: ${error.message}`,
      errorDetails: error,
      isTimeout: true,
      timestamp: Date.now(),
    }]);
    setStreamingStatus(null);
  }, []);

  const {
    connect,
    disconnect,
    connectionState,
    error,
    lastActivity,
  } = useSSE(apiUrl, {
    ...options,
    onMessage: handleMessage,
    onError: handleError,
    onTimeout: handleTimeout,
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

  const retry = useCallback(() => {
    // 找到最后一条用户消息并重新发送
    const lastUserMessage = [...messages].reverse().find(m => m.type === 'user');
    if (lastUserMessage) {
      sendMessage(lastUserMessage.content, lastUserMessage.metadata);
    }
  }, [messages, sendMessage]);

  return {
    messages,
    currentStream,
    streamingStatus,
    connectionState,
    error,
    lastActivity,
    isStreaming: connectionState === 'connecting' || connectionState === 'connected',
    sendMessage,
    clearMessages,
    disconnect,
    retry,
  };
}
