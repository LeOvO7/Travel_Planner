import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useWebSocket - WebSocket 自定义 Hook
 *
 * 支持功能：
 * - 自动重连
 * - 心跳检测
 * - 消息队列
 * - 连接状态管理
 *
 * @param {string} url - WebSocket 服务器 URL
 * @param {object} options - 配置选项
 * @returns {object} WebSocket 状态和方法
 */
export function useWebSocket(url, options = {}) {
  const {
    onOpen = () => {},
    onMessage = () => {},
    onError = () => {},
    onClose = () => {},
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000,
    heartbeatMessage = JSON.stringify({ type: 'ping' }),
  } = options;

  const [connectionState, setConnectionState] = useState('idle');
  const [reconnectCount, setReconnectCount] = useState(0);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatTimeoutRef = useRef(null);
  const messageQueueRef = useRef([]);

  /**
   * 发送心跳
   */
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(heartbeatMessage);

      heartbeatTimeoutRef.current = setTimeout(sendHeartbeat, heartbeatInterval);
    }
  }, [heartbeatMessage, heartbeatInterval]);

  /**
   * 停止心跳
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  /**
   * 安排重连
   */
  const scheduleReconnect = useCallback(() => {
    if (reconnectCount >= maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      setConnectionState('error');
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      setReconnectCount(prev => prev + 1);
      connect();
    }, reconnectInterval);
  }, [reconnectCount, maxReconnectAttempts, reconnectInterval]);

  /**
   * 建立 WebSocket 连接
   */
  const connect = useCallback(() => {
    // 关闭现有连接
    if (wsRef.current) {
      wsRef.current.close();
    }

    setConnectionState('connecting');

    try {
      const ws = new WebSocket(url);

      ws.onopen = (event) => {
        console.log('WebSocket connected');
        setConnectionState('connected');
        setReconnectCount(0);
        onOpen(event);

        // 开始心跳
        if (heartbeatInterval > 0) {
          sendHeartbeat();
        }

        // 发送队列中的消息
        while (messageQueueRef.current.length > 0) {
          const message = messageQueueRef.current.shift();
          ws.send(message);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch {
          onMessage(event.data);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setConnectionState('error');
        onError(event);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setConnectionState('disconnected');
        stopHeartbeat();
        onClose(event);

        // 尝试重连
        if (autoReconnect && !event.wasClean) {
          scheduleReconnect();
        }
      };

      wsRef.current = ws;

    } catch (error) {
      console.error('WebSocket connection error:', error);
      setConnectionState('error');
      onError(error);

      if (autoReconnect) {
        scheduleReconnect();
      }
    }
  }, [url, onOpen, onMessage, onError, onClose, autoReconnect, heartbeatInterval, sendHeartbeat, stopHeartbeat, scheduleReconnect]);

  /**
   * 断开连接
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopHeartbeat();

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    setConnectionState('disconnected');
    setReconnectCount(0);
    messageQueueRef.current = [];
  }, [stopHeartbeat]);

  /**
   * 发送消息
   */
  const sendMessage = useCallback((message) => {
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(messageStr);
    } else {
      // 连接未就绪，加入队列
      messageQueueRef.current.push(messageStr);
      console.warn('WebSocket not ready, message queued');
    }
  }, []);

  /**
   * 清理函数
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    sendMessage,
    connectionState,
    reconnectCount,
    isConnecting: connectionState === 'connecting',
    isConnected: connectionState === 'connected',
    isDisconnected: connectionState === 'disconnected',
    isError: connectionState === 'error',
  };
}

/**
 * useStreamingChatWS - 使用 WebSocket 的聊天流式传输 Hook
 */
export function useStreamingChatWS(wsUrl) {
  const [messages, setMessages] = useState([]);
  const [currentStream, setCurrentStream] = useState(null);
  const [streamingStatus, setStreamingStatus] = useState(null);

  const handleMessage = useCallback((data) => {
    const { type, ...payload } = data;

    switch (type) {
      case 'status':
        setStreamingStatus({
          type: 'status',
          message: payload.message,
          timestamp: Date.now(),
        });
        break;

      case 'tool_call':
        setMessages(prev => [...prev, {
          id: `tool_${Date.now()}`,
          type: 'tool_call',
          tool: payload.tool,
          args: payload.args,
          timestamp: Date.now(),
        }]);
        break;

      case 'chunk':
        setCurrentStream(prev => ({
          content: (prev?.content || '') + payload.content,
          timestamp: Date.now(),
        }));
        break;

      case 'result':
        const finalMessage = {
          id: `result_${Date.now()}`,
          type: 'assistant',
          content: payload.content,
          metadata: payload.metadata,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, finalMessage]);
        setCurrentStream(null);
        setStreamingStatus(null);
        break;

      case 'error':
        setMessages(prev => [...prev, {
          id: `error_${Date.now()}`,
          type: 'error',
          content: payload.error,
          timestamp: Date.now(),
        }]);
        setStreamingStatus(null);
        break;

      case 'done':
        setStreamingStatus({
          type: 'done',
          message: payload.message || 'Completed',
          timestamp: Date.now(),
        });
        setTimeout(() => setStreamingStatus(null), 2000);
        break;

      case 'pong':
        // 心跳响应，可以记录延迟等
        break;

      default:
        console.warn('Unknown message type:', type, payload);
    }
  }, []);

  const {
    connect,
    disconnect,
    sendMessage,
    connectionState,
    isConnected,
  } = useWebSocket(wsUrl, {
    onMessage: handleMessage,
    onError: (error) => {
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        type: 'error',
        content: error.message || 'Connection error',
        timestamp: Date.now(),
      }]);
    },
  });

  const sendChatMessage = useCallback((userMessage, requestData) => {
    // 添加用户消息
    const userMsg = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: userMessage,
      metadata: requestData,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);

    // 发送到服务器
    sendMessage({
      type: 'chat_request',
      content: userMessage,
      data: requestData,
    });
  }, [sendMessage]);

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
    isConnected,
    isStreaming: isConnected,
    connect,
    disconnect,
    sendMessage: sendChatMessage,
    clearMessages,
  };
}
