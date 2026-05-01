<template>
  <div class="flex h-screen bg-gray-50 overflow-hidden">
    <!-- 侧边栏 -->
    <Sidebar
      :isOpen="isSidebarOpen"
      :sessions="sessions"
      :currentSessionId="currentSessionId"
      @toggle="isSidebarOpen = !isSidebarOpen"
      @selectSession="selectSession"
      @newSession="createNewSession"
      @deleteSession="deleteSession"
    />

    <!-- 主聊天区域 -->
    <div
      :class="[
        'flex-1 flex flex-col transition-all duration-300',
        isSidebarOpen ? 'ml-64' : 'ml-0'
      ]"
    >
      <!-- 顶部标题栏 -->
      <div class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span class="text-white text-xl">✈️</span>
          </div>
          <div>
            <h1 class="text-lg font-semibold text-gray-900">
              {{ currentSession?.title || 'Smart Travel Planner' }}
            </h1>
            <p class="text-sm text-gray-500">
              AI-powered travel planning with real-time insights
            </p>
          </div>
        </div>
      </div>

      <!-- 消息列表区域 -->
      <div class="flex-1 overflow-y-auto px-6 py-6" ref="messagesContainer">
        <div class="max-w-4xl mx-auto">
          <EmptyState v-if="currentSession?.messages.length === 0" />
          <ChatMessage
            v-else
            v-for="message in currentSession?.messages"
            :key="message.id"
            :message="message"
          />
        </div>
      </div>

      <!-- 输入框 -->
      <ChatInput :isLoading="isStreaming" @submit="handleSubmit" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import Sidebar from './components/Sidebar.vue';
import ChatMessage from './components/ChatMessage.vue';
import ChatInput from './components/ChatInput.vue';
import EmptyState from './components/EmptyState.vue';

const API_URL = 'http://localhost:8000/api/travel/stream';

// 侧边栏状态
const isSidebarOpen = ref(true);

// 会话管理
const sessions = ref([]);
const currentSessionId = ref(null);
const isStreaming = ref(false);
const messagesContainer = ref(null);

// 计算当前会话
const currentSession = computed(() =>
  sessions.value.find(s => s.id === currentSessionId.value)
);

// 初始化：创建第一个会话
if (sessions.value.length === 0) {
  createNewSession();
}

// 自动滚动到底部
watch(() => currentSession.value?.messages.length, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
});

// 创建新会话
function createNewSession() {
  const newSession = {
    id: Date.now().toString(),
    title: 'New Trip',
    messages: [],
    createdAt: Date.now()
  };
  sessions.value.unshift(newSession);
  currentSessionId.value = newSession.id;
}

// 切换会话
function selectSession(sessionId) {
  currentSessionId.value = sessionId;
}

// 删除会话
function deleteSession(sessionId) {
  sessions.value = sessions.value.filter(s => s.id !== sessionId);
  if (currentSessionId.value === sessionId) {
    if (sessions.value.length > 0) {
      currentSessionId.value = sessions.value[0].id;
    } else {
      createNewSession();
    }
  }
}

// 添加消息
function addMessage(message) {
  const session = sessions.value.find(s => s.id === currentSessionId.value);
  if (session) {
    session.messages.push({ ...message, id: Date.now() });
  }
}

// 更新会话标题
function updateSessionTitle(sessionId, title) {
  const session = sessions.value.find(s => s.id === sessionId);
  if (session) {
    session.title = title;
  }
}

// 处理提交
async function handleSubmit(data) {
  if (!currentSessionId.value) return;

  // 添加用户消息
  addMessage({
    type: 'user',
    content: data.message || `Plan a trip to ${data.destination}`,
    metadata: {
      destination: data.destination,
      dates: data.dates
    }
  });

  // 更新会话标题
  if (currentSession.value.title === 'New Trip') {
    updateSessionTitle(currentSessionId.value, `Trip to ${data.destination}`);
  }

  // 开始流式请求
  isStreaming.value = true;

  try {
    await streamTravelPlan(data.destination, data.dates);
  } catch (error) {
    addMessage({
      type: 'error',
      content: error.message
    });
  } finally {
    isStreaming.value = false;
  }
}

// SSE 流式请求
async function streamTravelPlan(destination, travelDates) {
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
        }
      }
    }
  }
}
</script>
