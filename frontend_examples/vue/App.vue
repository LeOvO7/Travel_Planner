<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="container mx-auto px-4 py-8 max-w-4xl">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-800 mb-2">
          ✈️ Smart Travel Planner
        </h1>
        <p class="text-gray-600">
          AI-powered travel planning with real-time weather insights
        </p>
      </div>

      <!-- Form Card -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <form @submit.prevent="handleSubmit">
          <div class="grid md:grid-cols-2 gap-4 mb-4">
            <!-- Destination Input -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                📍 Destination
              </label>
              <input
                v-model="destination"
                type="text"
                placeholder="e.g., Tokyo, Paris, New York"
                :disabled="isStreaming"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <!-- Travel Dates Input -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                📅 Travel Dates
              </label>
              <input
                v-model="travelDates"
                type="text"
                placeholder="e.g., May 15-20, 2026"
                :disabled="isStreaming"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isStreaming || !destination.trim() || !travelDates.trim()"
            class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
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
      <div v-if="status" class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded">
        <div class="flex items-center">
          <svg class="animate-spin w-5 h-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-blue-700">{{ status }}</p>
        </div>
      </div>

      <!-- Tool Calls Display -->
      <div v-if="toolCalls.length > 0" class="bg-purple-50 border-l-4 border-purple-500 p-4 mb-4 rounded">
        <h3 class="font-semibold text-purple-900 mb-2">🔧 AI Actions:</h3>
        <div v-for="(call, idx) in toolCalls" :key="idx" class="text-sm text-purple-700 mb-1">
          ✓ Called <code class="bg-purple-100 px-2 py-1 rounded">{{ call.tool }}</code>
          <span v-if="call.args.city"> for {{ call.args.city }}</span>
        </div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
        <div class="flex items-center">
          <span class="text-red-600 mr-2">⚠️</span>
          <p class="text-red-700">{{ error }}</p>
        </div>
      </div>

      <!-- Result Display -->
      <div v-if="result" class="bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <span class="text-green-600 mr-2">✓</span>
          Your Travel Guide
        </h2>
        <div class="prose prose-sm max-w-none">
          <pre class="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed">{{ result }}</pre>
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

  // Reset state
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
