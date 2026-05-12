import { useState } from 'react';
import { PanelLeftClose, PanelLeft, Plus, MessageSquare, Clock, Trash2, Settings, Map, ExternalLink } from 'lucide-react';

/**
 * Sidebar Component - Session history sidebar
 */
export default function Sidebar({
  isOpen,
  onToggle,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onNavigate,
  currentView
}) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full bg-slate-900 text-white
          transition-all duration-300 ease-in-out z-40
          ${isOpen ? 'w-64 md:w-64 max-md:shadow-2xl' : 'w-0'}
          overflow-hidden
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Travel Planner</h2>
              <button
                onClick={onToggle}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                title="Close sidebar"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            </div>

            {/* New session button */}
            <button
              onClick={onNewSession}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                       bg-[#6366F1] hover:bg-indigo-600 active:bg-indigo-700 rounded-lg transition-all duration-200
                       font-medium text-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              New Trip Planning
            </button>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {sessions.length === 0 ? (
              <div className="text-center text-slate-500 py-10 px-4">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No trip plans yet</p>
                <p className="text-xs mt-1">Start a new planning session</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onMouseEnter={() => setHoveredId(session.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="relative group"
                >
                  <button
                    onClick={() => onSelectSession(session.id)}
                    className={`
                      w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200
                      ${currentSessionId === session.id
                        ? 'bg-slate-800 border border-indigo-500/30'
                        : 'hover:bg-slate-800/50'
                      }
                    `}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {session.title || 'New Trip'}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(session.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Hover actions */}
                  {hoveredId === session.id && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      {session.messages.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate?.('tripDetail', { session });
                          }}
                          className="p-1.5 bg-[#6366F1] hover:bg-indigo-600 rounded transition-all"
                          title="View trip detail"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="p-1.5 bg-[#EF4444] hover:bg-red-600 rounded transition-all"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Navigation */}
          <div className="p-3 border-t border-slate-700 space-y-1">
            <button
              onClick={() => onNavigate?.('mapView')}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                currentView === 'mapView'
                  ? 'bg-slate-800 border border-indigo-500/30'
                  : 'hover:bg-slate-800/50 text-slate-400'
              }`}
            >
              <Map className="w-4 h-4" />
              Map View
            </button>
            <button
              onClick={() => onNavigate?.('settings')}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                currentView === 'settings'
                  ? 'bg-slate-800 border border-indigo-500/30'
                  : 'hover:bg-slate-800/50 text-slate-400'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>

          {/* Footer info */}
          <div className="p-4 border-t border-slate-700">
            <div className="text-xs text-slate-500 space-y-1">
              <p>Powered by AI</p>
              <p className="truncate">Sessions: {sessions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Collapsed toggle button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed left-4 top-4 z-30 p-2.5 bg-slate-900 hover:bg-slate-800
                   text-white rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl"
          title="Open sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
      )}
    </>
  );
}

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
