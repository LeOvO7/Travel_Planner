import { useState, useEffect, useRef } from 'react';
import { Plane, Sparkles } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';

const API_URL = 'http://localhost:8000/api/travel/stream';

/**
 * Main App Component - 智能旅行规划助手
 * 左右分栏布局，支持多会话管理和流式响应
 */
export default function App() {
  // 侧边栏状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 会话管理
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // 消息和加载状态
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

  // 初始化：创建第一个会话
  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    }
  }, []);

  // 获取当前会话
  const currentSession = sessions.find(s => s.id === currentSessionId);

  // 创建新会话
  const createNewSession = () => {
    const newSession = {
      id: Date.now().toString(),
      title: 'New Trip',
      messages: [],
      createdAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  // 切换会话
  const selectSession = (sessionId) => {
    setCurrentSessionId(sessionId);
  };

  // 删除会话
  const deleteSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remaining = sessions.filter(s => s.id !== sessionId);
      if (remaining.length > 0) {
        setCurrentSessionId(remaining[0].id);
      } else {
        createNewSession();
      }
    }
  };

  // 添加消息到当前会话
  const addMessage = (message) => {
    setSessions(prev => prev.map(session => {
      if (session.id === currentSessionId) {
        return {
          ...session,
          messages: [...session.messages, { ...message, id: Date.now() }]
        };
      }
      return session;
    }));
  };

  // 更新会话标题
  const updateSessionTitle = (sessionId, title) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        return { ...session, title };
      }
      return session;
    }));
  };

  // 处理表单提交
  const handleSubmit = async (data) => {
    if (!currentSessionId) return;

    // 添加用户消息
    const userMessage = {
      type: 'user',
      content: data.message || `Plan a trip to ${data.destination}`,
      metadata: {
        destination: data.destination,
        dates: data.dates
      }
    };
    addMessage(userMessage);

    // 更新会话标题（如果是新会话）
    if (currentSession.title === 'New Trip') {
      updateSessionTitle(currentSessionId, `Trip to ${data.destination}`);
    }

    // 开始流式请求
    setIsStreaming(true);

    try {
      await streamTravelPlan(data.destination, data.dates);
    } catch (error) {
      addMessage({
        type: 'error',
        content: error.message
      });
    } finally {
      setIsStreaming(false);
    }
  };

  // SSE 流式请求
  const streamTravelPlan = async (destination, travelDates) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination,
        travel_dates: travelDates
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        const eventMatch = line.match(/^event: (.+)$/m);
        const dataMatch = line.match(/^data: (.+)$/m);

        if (eventMatch && dataMatch) {
          const eventType = eventMatch[1];
          const data = JSON.parse(dataMatch[1]);

          switch (eventType) {
            case 'status':
              addMessage({
                type: 'status',
                content: data.message
              });
              break;

            case 'tool_call':
              addMessage({
                type: 'tool_call',
                tool: data.tool,
                args: data.args
              });
              break;

            case 'result':
              addMessage({
                type: 'assistant',
                content: data.content
              });
              break;

            case 'error':
              addMessage({
                type: 'error',
                content: data.error
              });
              break;

            case 'done':
              // 可以添加完成提示
              break;
          }
        }
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* 侧边栏 */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={selectSession}
        onNewSession={createNewSession}
        onDeleteSession={deleteSession}
      />

      {/* 主聊天区域 */}
      <div
        className={`
          flex-1 flex flex-col transition-all duration-300
          ${isSidebarOpen ? 'ml-64' : 'ml-0'}
        `}
      >
        {/* 顶部标题栏 */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {currentSession?.title || 'Smart Travel Planner'}
              </h1>
              <p className="text-sm text-gray-500">
                AI-powered travel planning with real-time insights
              </p>
            </div>
          </div>
        </div>

        {/* 消息列表区域 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl mx-auto">
            {currentSession?.messages.length === 0 ? (
              <EmptyState />
            ) : (
              currentSession?.messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* 输入框 */}
        <ChatInput onSubmit={handleSubmit} isLoading={isStreaming} />
      </div>
    </div>
  );
}

// 空状态组件
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-6">
        <Sparkles className="w-10 h-10 text-blue-600" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">
        Welcome to Smart Travel Planner
      </h2>
      <p className="text-gray-600 mb-8 max-w-md">
        Plan your perfect trip with AI-powered recommendations based on real-time weather data
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
        <FeatureCard
          icon="🌤️"
          title="Weather Insights"
          description="Get accurate forecasts for your destination"
        />
        <FeatureCard
          icon="👕"
          title="Smart Packing"
          description="Personalized clothing and gear recommendations"
        />
        <FeatureCard
          icon="🎯"
          title="Activity Ideas"
          description="Weather-suitable activities for your trip"
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
