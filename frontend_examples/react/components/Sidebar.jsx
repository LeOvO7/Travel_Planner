import { useState } from 'react';
import { PanelLeftClose, PanelLeft, Plus, MessageSquare, Clock, Trash2 } from 'lucide-react';

/**
 * Sidebar Component - 会话历史侧边栏
 * 支持折叠、新建会话、切换历史会话
 */
export default function Sidebar({
  isOpen,
  onToggle,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession
}) {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <>
      {/* 侧边栏 */}
      <div
        className={`
          fixed left-0 top-0 h-full bg-gray-900 text-white
          transition-all duration-300 ease-in-out z-40
          ${isOpen ? 'w-64' : 'w-0'}
          overflow-hidden
        `}
      >
        <div className="flex flex-col h-full">
          {/* 头部 */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Travel Planner</h2>
              <button
                onClick={onToggle}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="关闭侧边栏"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            </div>

            {/* 新建会话按钮 */}
            <button
              onClick={onNewSession}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5
                       bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors
                       font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              New Trip Planning
            </button>
          </div>

          {/* 会话列表 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sessions.length === 0 ? (
              <div className="text-center text-gray-500 py-8 px-4">
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
                      w-full text-left px-3 py-2.5 rounded-lg transition-colors
                      ${currentSessionId === session.id
                        ? 'bg-gray-800 border border-gray-700'
                        : 'hover:bg-gray-800/50'
                      }
                    `}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {session.title || 'New Trip'}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(session.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* 删除按钮 */}
                  {hoveredId === session.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2
                               p-1.5 bg-red-600 hover:bg-red-700 rounded
                               opacity-0 group-hover:opacity-100 transition-opacity"
                      title="删除会话"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* 底部信息 */}
          <div className="p-4 border-t border-gray-700">
            <div className="text-xs text-gray-500 space-y-1">
              <p>💡 Powered by AI</p>
              <p className="truncate">Sessions: {sessions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 折叠时的展开按钮 */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed left-4 top-4 z-30 p-2.5 bg-gray-900 hover:bg-gray-800
                   text-white rounded-lg shadow-lg transition-colors"
          title="打开侧边栏"
        >
          <PanelLeft className="w-5 h-5" />
        </button>
      )}
    </>
  );
}

// 格式化日期
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
