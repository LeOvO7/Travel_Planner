import { useState, useEffect, useRef } from 'react';
import { Plane, Sparkles } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';

const API_URL = 'http://localhost:8000/api/travel/stream';

/**
 * Main App Component
 */
export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);

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
      createdAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const selectSession = (sessionId) => {
    setCurrentSessionId(sessionId);
  };

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

  const updateSessionTitle = (sessionId, title) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        return { ...session, title };
      }
      return session;
    }));
  };

  const handleSubmit = async (data) => {
    if (!currentSessionId) return;

    const userMessage = {
      type: 'user',
      content: data.message || `Plan a trip to ${data.destination}`,
      metadata: {
        destination: data.destination,
        dates: data.dates
      }
    };
    addMessage(userMessage);

    if (currentSession.title === 'New Trip') {
      updateSessionTitle(currentSessionId, `Trip to ${data.destination}`);
    }

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
              addMessage({ type: 'status', content: data.message });
              break;
            case 'tool_call':
              addMessage({ type: 'tool_call', tool: data.tool, args: data.args });
              break;
            case 'result':
              addMessage({ type: 'assistant', content: data.content });
              break;
            case 'error':
              addMessage({ type: 'error', content: data.error });
              break;
            case 'done':
              break;
          }
        }
      }
    }
  };

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
                AI-powered travel planning with real-time insights
              </p>
            </div>
          </div>
        </div>

        {/* Message list area */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
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
        Plan your perfect trip with AI-powered recommendations based on real-time weather data
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-2xl">
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
    <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-default">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-[#0F172A] mb-1">{title}</h3>
      <p className="text-sm text-[#64748B] leading-relaxed">{description}</p>
    </div>
  );
}
