import { useState, useRef, useEffect } from 'react';
import { Plane, Sparkles } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import Settings from './components/Settings';
import TripDetail from './components/TripDetail';
import MapView from './components/MapView';
import { generateMockSession } from './utils/mockTravelData';

const API_URL = 'http://localhost:8000/api/travel/stream';

/**
 * Main App Component
 */
export default function App() {
  // Initialize sidebar based on screen size
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return window.innerWidth >= 768;
  });
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentView, setCurrentView] = useState('chat');
  const [viewData, setViewData] = useState(null);
  const [displayedMessageCount, setDisplayedMessageCount] = useState(50);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Handle window resize to auto-close sidebar on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (currentSession && currentSession.messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession?.messages.length]);

  // Reset displayed message count when switching sessions
  useEffect(() => {
    setDisplayedMessageCount(50);
  }, [currentSessionId]);

  // Handle scroll to load more messages
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop } = scrollContainer;

      // If user scrolled near the top (within 200px), load more messages
      if (scrollTop < 200 && currentSession && displayedMessageCount < currentSession.messages.length) {
        const prevScrollHeight = scrollContainer.scrollHeight;
        const prevScrollTop = scrollContainer.scrollTop;

        setDisplayedMessageCount(prev => Math.min(prev + 20, currentSession.messages.length));

        // Preserve scroll position after loading more
        requestAnimationFrame(() => {
          const newScrollHeight = scrollContainer.scrollHeight;
          scrollContainer.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
        });
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [currentSession, displayedMessageCount]);

  const createNewSession = () => {
    const newSession = {
      id: Date.now().toString(),
      title: 'New Trip',
      messages: [],
      createdAt: Date.now(),
      hasInitialInput: false,
      initialTripData: null
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setCurrentView('chat');
  };

  const loadMockData = (city = 'New York') => {
    const mockSession = generateMockSession(city);
    setSessions(prev => [mockSession, ...prev]);
    setCurrentSessionId(mockSession.id);
    setCurrentView('chat');
  };

  const selectSession = (sessionId) => {
    setCurrentSessionId(sessionId);
    setCurrentView('chat');
  };

  const deleteSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      const remaining = sessions.filter(s => s.id !== sessionId);
      setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const addMessage = (message, targetSessionId) => {
    const sid = targetSessionId ?? currentSessionId;
    setSessions(prev => prev.map(session => {
      if (session.id === sid) {
        return {
          ...session,
          messages: [...session.messages, { ...message, id: Date.now() }]
        };
      }
      return session;
    }));
  };

  const markAllStatusCompleted = (targetSessionId) => {
    const sid = targetSessionId ?? currentSessionId;
    setSessions(prev => prev.map(session => {
      if (session.id === sid) {
        return {
          ...session,
          messages: session.messages.map(msg =>
            msg.type === 'status' ? { ...msg, completed: true } : msg
          )
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

  const handleNavigate = (view, data) => {
    setCurrentView(view);
    if (data) setViewData(data);
  };

  const handleSubmit = async (data) => {
    // Check for mock data trigger condition
    const isMockTrigger = data.departure === '1' && data.destination === '1' && data.message === 'test';

    if (isMockTrigger) {
      // Load mock data directly instead of calling API
      loadMockData('New York');
      return;
    }

    let sessionId = currentSessionId;
    let session = sessions.find(s => s.id === sessionId);

    // Auto-create a session if none exists
    if (!sessionId) {
      const newSession = {
        id: Date.now().toString(),
        title: `Trip to ${data.destination}`,
        messages: [],
        createdAt: Date.now(),
        hasInitialInput: false,
        initialTripData: null
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      sessionId = newSession.id;
      session = newSession;
    }

    // Ensure we're in chat view
    setCurrentView('chat');

    // Use initial trip data for subsequent messages if available
    const tripData = session?.initialTripData || {
      departure: data.departure,
      destination: data.destination,
      dates: data.dates
    };

    const userMessage = {
      type: 'user',
      content: data.message || `Plan a trip to ${tripData.destination}`,
      metadata: {
        departure: tripData.departure,
        destination: tripData.destination,
        dates: tripData.dates
      }
    };
    addMessage(userMessage, sessionId);

    if (!session || session.title === 'New Trip') {
      updateSessionTitle(sessionId, `Trip to ${tripData.destination}`);
    }

    // Save initial trip data and mark that this session has received initial input
    if (!session?.hasInitialInput) {
      setSessions(prev => prev.map(s =>
        s.id === sessionId ? {
          ...s,
          hasInitialInput: true,
          initialTripData: {
            departure: data.departure,
            destination: data.destination,
            dates: data.dates
          }
        } : s
      ));
    }

    setIsStreaming(true);

    try {
      await streamTravelPlan(tripData.departure, tripData.destination, tripData.dates, sessionId);
    } catch (error) {
      addMessage({
        type: 'error',
        content: error.message
      }, sessionId);
    } finally {
      setIsStreaming(false);
    }
  };

  const streamTravelPlan = async (departure, destination, travelDates, sessionId) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        departure: departure || '',
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
              addMessage({ type: 'status', content: data.message }, sessionId);
              break;
            case 'tool_call':
              addMessage({ type: 'tool_call', tool: data.tool, args: data.args }, sessionId);
              break;
            case 'result':
              addMessage({
                type: 'assistant',
                content: data.content,
                structuredData: data.structured_data || [],
              }, sessionId);
              break;
            case 'error':
              addMessage({ type: 'error', content: data.error }, sessionId);
              break;
            case 'done':
              markAllStatusCompleted(sessionId);
              break;
          }
        }
      }
    }
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'settings':
        return <Settings sessions={sessions} onClearSessions={() => setSessions([])} />;
      case 'tripDetail':
        return (
          <TripDetail
            session={viewData?.session || currentSession}
            onBack={() => setCurrentView('chat')}
            onOpenMap={(data) => handleNavigate('mapView', data)}
            onContinueChat={() => setCurrentView('chat')}
          />
        );
      case 'mapView':
        return (
          <MapView
            session={viewData?.session || currentSession}
            onBack={() => setCurrentView(viewData?.from || 'chat')}
          />
        );
      default:
        return (
          <>
            {/* Top header bar */}
            <div className={`bg-white border-b border-[#E2E8F0] py-3 md:py-4 shadow-sm transition-all duration-300 ${isSidebarOpen ? 'px-3 md:px-6' : 'px-3 md:pl-16 md:pr-6'}`}>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-[#6366F1] flex items-center justify-center shadow-sm flex-shrink-0">
                  <Plane className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base md:text-lg font-semibold text-[#0F172A] truncate">
                    {currentSession?.title || 'Smart Travel Planner'}
                  </h1>
                  <p className="text-xs md:text-sm text-[#64748B] hidden sm:block truncate">
                    AI-powered travel planning with real-time insights
                  </p>
                </div>
              </div>
            </div>

            {/* Message list area */}
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden px-3 md:px-6 py-4 md:py-8">
              <div className="max-w-4xl mx-auto w-full">
                {!currentSession || currentSession.messages.length === 0 ? (
                  <EmptyState />
                ) : (
                  <>
                    {/* Load more indicator */}
                    {currentSession.messages.length > displayedMessageCount && (
                      <div className="flex justify-center mb-6">
                        <button
                          onClick={() => setDisplayedMessageCount(prev => Math.min(prev + 20, currentSession.messages.length))}
                          className="px-4 py-2 text-sm font-medium text-[#6366F1] bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          Load {Math.min(20, currentSession.messages.length - displayedMessageCount)} more messages
                        </button>
                      </div>
                    )}

                    {/* Render only the latest N messages */}
                    {currentSession.messages
                      .slice(-displayedMessageCount)
                      .map((message, index, arr) => (
                        <ChatMessage
                          key={message.id}
                          message={message}
                          isLatest={index === arr.length - 1}
                        />
                      ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </div>

            {/* Input area */}
            <ChatInput
              onSubmit={handleSubmit}
              isLoading={isStreaming}
              hasInitialInput={currentSession?.hasInitialInput || false}
            />
          </>
        );
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
        onNavigate={handleNavigate}
        currentView={currentView}
      />

      {/* Main content area */}
      <div
        className={`
          flex-1 flex flex-col transition-all duration-300
          ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}
        `}
      >
        {renderMainContent()}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 md:py-16 px-3">
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-4 md:mb-6">
        <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-[#6366F1]" />
      </div>
      <h2 className="text-xl md:text-2xl font-semibold text-[#0F172A] mb-2 md:mb-3">
        Welcome to Smart Travel Planner
      </h2>
      <p className="text-sm md:text-base text-[#64748B] mb-6 md:mb-10 max-w-md leading-relaxed px-4">
        Plan your perfect trip with AI-powered recommendations based on real-time weather data
      </p>
      <div className="grid grid-cols-3 gap-2 md:gap-5 max-w-2xl w-full px-2">
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
      <p className="text-xs text-[#94A3B8] mt-6 md:mt-10 px-4">
        Click <span className="font-semibold text-[#6366F1]">+ New Trip Planning</span> in the sidebar, or just type below
      </p>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white rounded-lg md:rounded-xl p-2.5 md:p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-default text-left">
      <div className="text-2xl md:text-3xl mb-1.5 md:mb-3">{icon}</div>
      <h3 className="font-semibold text-[#0F172A] mb-0.5 md:mb-1 text-xs md:text-base">{title}</h3>
      <p className="text-[10px] md:text-sm text-[#64748B] leading-relaxed hidden md:block">{description}</p>
    </div>
  );
}
