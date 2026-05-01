import { ref, onUnmounted } from 'vue';

/**
 * useSSE - Vue Composable for Server-Sent Events
 *
 * @param {string} url - SSE endpoint URL
 * @param {object} options - Configuration options
 * @returns {object} SSE state and methods
 */
export function useSSE(url, options = {}) {
  const {
    onMessage = () => {},
    onError = () => {},
    onOpen = () => {},
    onClose = () => {},
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 3,
  } = options;

  const connectionState = ref('idle');
  const reconnectCount = ref(0);

  let abortController = null;
  let reconnectTimeout = null;

  /**
   * Parse SSE event
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
   * Parse SSE stream
   */
  const parseSSEStream = async (response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          connectionState.value = 'disconnected';
          onClose();
          break;
        }

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
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('SSE Stream Error:', error);
        connectionState.value = 'error';
        onError(error);

        if (autoReconnect && reconnectCount.value < maxReconnectAttempts) {
          scheduleReconnect();
        }
      }
    }
  };

  /**
   * Schedule reconnection
   */
  const scheduleReconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }

    reconnectTimeout = setTimeout(() => {
      reconnectCount.value++;
      console.log(`Reconnecting... (${reconnectCount.value}/${maxReconnectAttempts})`);
      connect();
    }, reconnectInterval);
  };

  /**
   * Connect to SSE
   */
  const connect = async (requestData = {}) => {
    if (abortController) {
      abortController.abort();
    }

    abortController = new AbortController();
    connectionState.value = 'connecting';
    reconnectCount.value = 0;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify(requestData),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      connectionState.value = 'connected';
      onOpen();

      await parseSSEStream(response);

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('SSE Connection Error:', error);
        connectionState.value = 'error';
        onError(error);

        if (autoReconnect && reconnectCount.value < maxReconnectAttempts) {
          scheduleReconnect();
        }
      }
    }
  };

  /**
   * Disconnect
   */
  const disconnect = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }

    connectionState.value = 'disconnected';
    reconnectCount.value = 0;
  };

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect();
  });

  return {
    connect,
    disconnect,
    connectionState,
    reconnectCount,
  };
}

/**
 * useStreamingChat - Composable for streaming chat with SSE
 */
export function useStreamingChat(apiUrl) {
  const messages = ref([]);
  const currentStream = ref(null);
  const streamingStatus = ref(null);

  const handleMessage = (event) => {
    const { type, data } = event;

    switch (type) {
      case 'status':
        streamingStatus.value = {
          type: 'status',
          message: data.message,
          timestamp: Date.now(),
        };
        break;

      case 'tool_call':
        messages.value.push({
          id: `tool_${Date.now()}`,
          type: 'tool_call',
          tool: data.tool,
          args: data.args,
          timestamp: Date.now(),
        });
        break;

      case 'chunk':
        currentStream.value = {
          content: (currentStream.value?.content || '') + data.content,
          timestamp: Date.now(),
        };
        break;

      case 'result':
        messages.value.push({
          id: `result_${Date.now()}`,
          type: 'assistant',
          content: data.content,
          metadata: data.metadata,
          timestamp: Date.now(),
        });
        currentStream.value = null;
        streamingStatus.value = null;
        break;

      case 'error':
        messages.value.push({
          id: `error_${Date.now()}`,
          type: 'error',
          content: data.error,
          timestamp: Date.now(),
        });
        streamingStatus.value = null;
        break;

      case 'done':
        streamingStatus.value = {
          type: 'done',
          message: data.message || 'Completed',
          timestamp: Date.now(),
        };
        setTimeout(() => {
          streamingStatus.value = null;
        }, 2000);
        break;
    }
  };

  const { connect, disconnect, connectionState } = useSSE(apiUrl, {
    onMessage: handleMessage,
    onError: (error) => {
      messages.value.push({
        id: `error_${Date.now()}`,
        type: 'error',
        content: error.message,
        timestamp: Date.now(),
      });
    },
    autoReconnect: false,
  });

  const sendMessage = async (userMessage, requestData) => {
    const userMsg = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: userMessage,
      metadata: requestData,
      timestamp: Date.now(),
    };

    messages.value.push(userMsg);
    await connect(requestData);
  };

  const clearMessages = () => {
    messages.value = [];
    currentStream.value = null;
    streamingStatus.value = null;
  };

  return {
    messages,
    currentStream,
    streamingStatus,
    connectionState,
    sendMessage,
    clearMessages,
    disconnect,
  };
}
