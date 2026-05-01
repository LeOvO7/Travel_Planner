import { useState, useEffect } from 'react';
import { Plane, Sparkles } from 'lucide-react';
import { useStreamingChat } from './hooks/useSSE';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage-Enhanced';
import ChatInput from './components/ChatInput';
import StatusAccordion from './components/StatusAccordion';

const API_URL = 'http://localhost:8000/api/travel/stream';

/**
 * App-Complete - 完整的流式聊天应用
 *
 * 功能：
 * - SSE 流式通信
 * - Markdown 渲染（代码高亮+复制）
 * - 工作流状态展示
 * - 多会话管理
 * - 自适应响应式设计
 */
export default function App() {
  // 侧边栏状态
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 会话管理
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // 工作流步骤
  const [workflowSteps, setWorkflowSteps] = useState([]);

  // 流式聊天 Hook
  const {
    messages,
    currentStream,
    streamingStatus,
    isStreaming,
    sendMessage,
    disconnect,
  } = useStreamingChat(API_URL);

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
      workflowSteps: [],
      createdAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setWorkflowSteps([]);
  };

  // 切换会话
  const selectSession = (sessionId) => {
    // 保存当前会话的消息和工作流
    if (currentSessionId) {
      setSessions(prev => prev.map(s =>
        s.id === currentSessionId
          ? { ...s, messages, workflowSteps }
          : s
      ));
    }

    // 切换到新会话
    setCurrentSessionId(sessionId);
    const newSession = sessions.find(s => s.id === sessionId);
    if (newSession) {
      setWorkflowSteps(newSession.workflowSteps || []);
    }
  };

  // 删除会话
  const deleteSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remaining = sessions.filter(s => s.id !== sessionId);
      if (remaining.length > 0) {
        selectSession(remaining[0].id);
      } else {
        createNewSession();
      }
    }
  };

  // 更新会话标题
  const updateSessionTitle = (sessionId, title) => {
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, title } : s
    ));
  };

  // 监听消息变化，更新工作流步骤
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    if (lastMessage?.type === 'tool_call') {
      setWorkflowSteps(prev => [...prev, {
        id: lastMessage.id,
        title: `Tool: ${lastMessage.tool}`,
        description: `Calling ${lastMessage.tool}`,
        type: 'tool_call',
        tool: lastMessage.tool,
        args: lastMessage.args,
        status: 'completed',
        duration: 1500,
      }]);
    } else if (lastMessage?.type === 'status') {
      // 更新最后一个步骤的状态
      setWorkflowSteps(prev => {
        const newSteps = [...prev];
        if (newSteps.length > 0) {
          newSteps[newSteps.length - 1].status = 'processing';
        }
        return newSteps;
      });
    }
  }, [messages]);

  // 处理表单提交
  const handleSubmit = async (data) => {
    if (!currentSessionId) return;

    // 清空工作流步骤
    setWorkflowSteps([]);

    // 更新会话标题（如果是新会话）
    if (currentSession.title === 'New Trip') {
      updateSessionTitle(currentSessionId, `Trip to ${data.destination}`);
    }

    // 发送消息
    await sendMessage(
      data.message || `Plan a trip to ${data.destination}`,
      {
        destination: data.destination,
        travel_dates: data.dates,
      }
    );
  };

  // 合并当前流式消息到消息列表
  const allMessages = currentStream
    ? [...messages, {
        ...currentStream,
        id: 'streaming',
        type: 'streaming',
      }]
    : messages;

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
                AI-powered travel planning with streaming insights
              </p>
            </div>

            {/* 连接状态指示 */}
            {isStreaming && (
              <div className="ml-auto flex items-center gap-2 text-sm text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span>Streaming...</span>
              </div>
            )}
          </div>
        </div>

        {/* 消息列表区域 */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
          <div className="max-w-4xl mx-auto">
            {allMessages.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {/* 工作流状态（如果有） */}
                {workflowSteps.length > 0 && (
                  <StatusAccordion
                    steps={workflowSteps}
                    isActive={isStreaming}
                  />
                )}

                {/* 消息列表 */}
                {allMessages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}

                {/* 流式状态提示 */}
                {streamingStatus && (
                  <div className="flex justify-center my-4">
                    <div className="text-sm text-gray-500">
                      {streamingStatus.message}
                    </div>
                  </div>
                )}
              </>
            )}
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
        Experience AI-powered travel planning with real-time streaming, Markdown rendering, and beautiful UI
      </p>

      {/* 功能特性 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
        <FeatureCard
          emoji="🌊"
          title="Streaming Responses"
          description="See AI thinking in real-time with SSE"
        />
        <FeatureCard
          emoji="📝"
          title="Markdown Support"
          description="Rich formatting with code highlighting"
        />
        <FeatureCard
          emoji="⚡"
          title="Workflow Tracking"
          description="Visualize each step of the process"
        />
      </div>

      {/* 使用提示 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-md">
        <p className="text-sm text-blue-700">
          💡 <strong>Tip:</strong> Enter your destination and travel dates below to get started!
        </p>
      </div>
    </div>
  );
}

function FeatureCard({ emoji, title, description }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all hover:-translate-y-1">
      <div className="text-4xl mb-3">{emoji}</div>
      <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
