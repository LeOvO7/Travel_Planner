<template>
  <div class="min-h-screen bg-[#F8FAFC]">
    <div class="container mx-auto px-4 py-10 max-w-4xl">
      <!-- Header -->
      <div class="text-center mb-10">
        <h1 class="text-4xl font-bold text-[#0F172A] mb-3">
          ✈️ Smart Travel Planner
        </h1>
        <p class="text-[#64748B] text-lg">
          AI-powered travel planning with real-time weather insights
        </p>
      </div>

      <!-- Form Card -->
      <div class="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-8 mb-8 hover:shadow-md transition-shadow duration-200">
        <form @submit.prevent="handleSubmit">
          <div class="grid md:grid-cols-2 gap-5 mb-6">
            <!-- Destination Input -->
            <div>
              <label class="block text-sm font-medium text-[#0F172A] mb-2">
                📍 Destination
              </label>
              <input
                v-model="destination"
                type="text"
                placeholder="e.g., Tokyo, Paris, New York"
                :disabled="isStreaming"
                class="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent outline-none transition-all text-[#0F172A] placeholder:text-[#64748B]"
              />
            </div>

            <!-- Travel Dates Input -->
            <div>
              <label class="block text-sm font-medium text-[#0F172A] mb-2">
                📅 Travel Dates
              </label>
              <input
                v-model="travelDates"
                type="text"
                placeholder="e.g., May 15-20, 2026"
                :disabled="isStreaming"
                class="w-full px-4 py-2.5 border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#6366F1] focus:border-transparent outline-none transition-all text-[#0F172A] placeholder:text-[#64748B]"
              />
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isStreaming || !destination.trim() || !travelDates.trim()"
            class="w-full bg-[#6366F1] hover:bg-indigo-600 active:bg-indigo-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center hover:shadow-md"
          >
            <span v-if="isStreaming" class="flex items-center">
              <svg class="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Planning Your Trip...
            </span>
            <span v-else>Generate Travel Guide</span>
          </button>
        </form>
      </div>

      <!-- Status Display -->
      <div v-if="status" class="bg-indigo-50 border-l-4 border-[#6366F1] p-4 mb-5 rounded-lg">
        <div class="flex items-center">
          <svg class="animate-spin w-5 h-5 text-[#6366F1] mr-3" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-indigo-700 font-medium">{{ status }}</p>
        </div>
      </div>

      <!-- Tool Calls Display -->
      <div v-if="toolCalls.length > 0" class="bg-white border border-[#E2E8F0] p-5 mb-5 rounded-xl shadow-sm">
        <h3 class="font-semibold text-[#0F172A] mb-3">🔧 AI Actions:</h3>
        <div v-for="(call, idx) in toolCalls" :key="idx" class="text-sm text-[#64748B] mb-1.5 flex items-center gap-2">
          <span class="text-[#10B981]">✓</span>
          Called <code class="bg-indigo-50 text-[#6366F1] px-2 py-0.5 rounded text-xs font-medium">{{ call.tool }}</code>
          <span v-if="call.args.city"> for {{ call.args.city }}</span>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="bg-red-50 border-2 border-[#EF4444]/30 p-5 mb-5 rounded-xl shadow-sm">
        <div class="flex items-center gap-2">
          <span class="text-[#EF4444]">⚠️</span>
          <p class="text-[#64748B]">{{ error }}</p>
        </div>
      </div>

      <!-- Result Display -->
      <div v-if="result" class="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-8 hover:shadow-md transition-shadow duration-200">
        <h2 class="text-2xl font-bold text-[#0F172A] mb-4 flex items-center">
          <span class="text-[#10B981] mr-2">✓</span>
          Your Travel Guide
        </h2>
        <div class="prose prose-sm max-w-none">
          <pre class="whitespace-pre-wrap font-sans text-[#0F172A] leading-relaxed">{{ result }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const destination = ref('');
const travelDates = ref('');
const status = ref('');
const toolCalls = ref([]);
const result = ref('');
const error = ref('');
const isStreaming = ref(false);

const handleSubmit = async () => {
  if (!destination.value.trim() || !travelDates.value.trim()) return;

  status.value = '';
  toolCalls.value = [];
  result.value = '';
  error.value = '';
  isStreaming.value = true;

  try {
    const response = await fetch('http://localhost:8000/api/travel/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: destination.value,
        travel_dates: travelDates.value
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
              status.value = data.message;
              break;
            case 'tool_call':
              toolCalls.value.push({
                tool: data.tool,
                args: data.args
              });
              break;
            case 'result':
              result.value = data.content;
              break;
            case 'error':
              error.value = data.error;
              break;
            case 'done':
              status.value = 'Travel guide generated successfully!';
              break;
          }
        }
      }
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    isStreaming.value = false;
  }
};
</script>

<style scoped>
/* Optional: Add custom styles if needed */
</style>
