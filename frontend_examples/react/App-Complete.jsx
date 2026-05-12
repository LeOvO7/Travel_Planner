import { useState, useEffect } from 'react';
import { Plane, Sparkles } from 'lucide-react';
import { useStreamingChat } from './hooks/useSSE';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage-Enhanced';
import ChatInput from './components/ChatInput';
import StatusAccordion from './components/StatusAccordion';

const API_URL = 'http://localhost:8000/api/travel/stream';

/**
 * App-Complete - Full streaming chat application
 */
export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [workflowSteps, setWorkflowSteps] = useState([]);

  const {
    messages,
    currentStream,
    streamingStatus,
    isStreaming,
    sendMessage,
    disconnect,
  } = useStreamingChat(API_URL);

  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    }
  }, []);

  const currentSession = sessions.find(s => s.id === currentSessionId);

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

  const selectSession = (sessionId) => {
    if (currentSessionId) {
      setSessions(prev => prev.map(s =>
        s.id === currentSessionId
          ? { ...s, messages, workflowSteps }
          : s
      ));
    }
    setCurrentSessionId(sessionId);
    const newSession = sessions.find(s => s.id === sessionId);
    if (newSession) {
      setWorkflowSteps(newSession.workflowSteps || []);
    }
  };

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

  const updateSessionTitle = (sessionId, title) => {
    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, title } : s
    ));
  };

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
      setWorkflowSteps(prev => {
        const newSteps = [...prev];
        if (newSteps.length > 0) {
          newSteps[newSteps.length - 1].status = 'processing';
        }
        return newSteps;
      });
    }
  }, [messages]);

  const handleSubmit = async (data) => {
    if (!currentSessionId) return;

    setWorkflowSteps([]);

    if (currentSession.title === 'New Trip') {
      updateSessionTitle(currentSessionId, `Trip to ${data.destination}`);
    }

    await sendMessage(
      data.message || `Plan a trip to ${data.destination}`,
      {
        destination: data.destination,
        travel_dates: data.dates,
      }
    );
  };

  const allMessages = currentStream
    ? [...messages, {
        ...currentStream,
        id: 'streaming',
        type: 'streaming',
      }]
    : messages;

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={selectSession}
        onNewSession={createNewSession}
        onDeleteSession={deleteSession}
      />

      {/* Main chat area */}
      <div
        className={`
          flex-1 flex flex-col transition-all duration-300
          ${isSidebarOpen ? 'ml-64' : 'ml-0'}
        `}
      >
        {/* Top header bar */}
        <div className="bg-white border-b border-[#E2E8F0] px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6366F1] flex items-center justify-center shadow-sm">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#0F172A]">
                {currentSession?.title || 'Smart Travel Planner'}
              </h1>
              <p className="text-sm text-[#64748B]">
                AI-powered travel planning with streaming insights
              </p>
            </div>

            {/* Streaming status indicator */}
            {isStreaming && (
              <div className="ml-auto flex items-center gap-2 text-sm text-[#6366F1]">
                <div className="w-2 h-2 bg-[#6366F1] rounded-full animate-pulse" />
                <span className="font-medium">Streaming...</span>
              </div>
            )}
          </div>
        </div>

        {/* Message list area */}
        <div className="flex-1 overflow-y-auto px-6 py-8 scrollbar-thin">
          <div className="max-w-4xl mx-auto">
            {allMessages.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                {workflowSteps.length > 0 && (
                  <StatusAccordion
                    steps={workflowSteps}
                    isActive={isStreaming}
                  />
                )}

                {allMessages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}

                {streamingStatus && (
                  <div className="flex justify-center my-4">
                    <div className="text-sm text-[#64748B]">
                      {streamingStatus.message}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Input area */}
        <ChatInput onSubmit={handleSubmit} isLoading={isStreaming} />
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-16">
      <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
        <Sparkles className="w-10 h-10 text-[#6366F1]" />
      </div>
      <h2 className="text-2xl font-semibold text-[#0F172A] mb-3">
        Welcome to Smart Travel Planner
      </h2>
      <p className="text-[#64748B] mb-10 max-w-md leading-relaxed">
        Experience AI-powered travel planning with real-time streaming, Markdown rendering, and beautiful UI
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl">
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

      <div className="mt-10 p-4 bg-indigo-50 border border-indigo-100 rounded-xl max-w-md">
        <p className="text-sm text-indigo-700">
          💡 <strong>Tip:</strong> Enter your destination and travel dates below to get started!
        </p>
      </div>
    </div>
  );
}

function FeatureCard({ emoji, title, description }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-default">
      <div className="text-4xl mb-3">{emoji}</div>
      <h3 className="font-semibold text-[#0F172A] mb-1">{title}</h3>
      <p className="text-sm text-[#64748B] leading-relaxed">{description}</p>
    </div>
  );
}
