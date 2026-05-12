<template>
  <div class="flex h-screen bg-[#F8FAFC] overflow-hidden">
    <!-- Sidebar -->
    <Sidebar
      :isOpen="isSidebarOpen"
      :sessions="sessions"
      :currentSessionId="currentSessionId"
      @toggle="isSidebarOpen = !isSidebarOpen"
      @selectSession="selectSession"
      @newSession="createNewSession"
      @deleteSession="deleteSession"
    />

    <!-- Main chat area -->
    <div
      :class="[
        'flex-1 flex flex-col transition-all duration-300',
        isSidebarOpen ? 'ml-64' : 'ml-0'
      ]"
    >
      <!-- Top header bar -->
      <div class="bg-white border-b border-[#E2E8F0] px-6 py-4 shadow-sm">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-[#6366F1] flex items-center justify-center shadow-sm">
            <span class="text-white text-xl">✈️</span>
          </div>
          <div>
            <h1 class="text-lg font-semibold text-[#0F172A]">
              {{ currentSession?.title || 'Smart Travel Planner' }}
            </h1>
            <p class="text-sm text-[#64748B]">
              AI-powered travel planning with real-time insights
            </p>
          </div>
        </div>
      </div>

      <!-- Message list area -->
      <div class="flex-1 overflow-y-auto px-6 py-8" ref="messagesContainer">
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

      <!-- Input area -->
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

const isSidebarOpen = ref(true);
const sessions = ref([]);
const currentSessionId = ref(null);
const isStreaming = ref(false);
const messagesContainer = ref(null);

const currentSession = computed(() =>
  sessions.value.find(s => s.id === currentSessionId.value)
);

if (sessions.value.length === 0) {
  createNewSession();
}

watch(() => currentSession.value?.messages.length, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
});

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

function selectSession(sessionId) {
  currentSessionId.value = sessionId;
}

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

function addMessage(message) {
  const session = sessions.value.find(s => s.id === currentSessionId.value);
  if (session) {
    session.messages.push({ ...message, id: Date.now() });
  }
}

function updateSessionTitle(sessionId, title) {
  const session = sessions.value.find(s => s.id === sessionId);
  if (session) {
    session.title = title;
  }
}

async function handleSubmit(data) {
  if (!currentSessionId.value) return;

  addMessage({
    type: 'user',
    content: data.message || `Plan a trip to ${data.destination}`,
    metadata: {
      destination: data.destination,
      dates: data.dates
    }
  });

  if (currentSession.value.title === 'New Trip') {
    updateSessionTitle(currentSessionId.value, `Trip to ${data.destination}`);
  }

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
