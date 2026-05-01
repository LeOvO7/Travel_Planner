#  Travel Planner 

AI-powered travel planning assistant with weather-based recommendations, now with a modern web interface!

## Project Overview

This is an intelligent travel planning system built on LangGraph, OpenAI, and FastAPI, capable of:
- 🌤️ Real-time Weather Forecasts
- 🤖 AI-Powered Travel Recommendations
- 👕 Clothing Suggestions Based on Weather
- 🎒 Essential Packing Checklist
- 🎨 Weather-Appropriate Activity Recommendations

## Project Structure

```
Whether/
├── travel_agent.py          # Core AI Agent Logic
├── backend/
│   ├── app.py              # FastAPI Server (SSE Streaming Endpoint)
│   └── requirements.txt    # Python Dependencies
├── frontend_examples/      # Frontend Example Code
│   ├── simple_demo.html   # Zero-Config HTML Demo Page
│   ├── react/             # React Components and Examples
│   └── vue/               # Vue Components and Examples
├── start_backend.bat      # Windows Startup Script
├── start_backend.sh       # Linux/Mac Startup Script
├── .env.example           # Environment Variable Template
└── README.md              # This File
```

##  Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- OpenWeather API Key ([Get for Free](https://openweathermap.org/api))
- OpenAI API Key ([Get Address](https://platform.openai.com/api-keys))

### 1️⃣ Configure Environment Variables

Create a `.env` file in the project directory:

```bash
OPENWEATHER_API_KEY=your_openweather_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### 2️⃣ Start the Backend

```bash
pip install -r backend/requirements.txt
uvicorn backend.app:app --reload --port 8000
```

Visit http://localhost:8000 to check the API status.
API Documentation: http://localhost:8000/docs

### 3️⃣ Initialize Frontend

#### Option A: React + Vite + Tailwind

```bash
# Create Project
npm create vite@latest frontend -- --template react
cd frontend

# Install Dependencies
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install lucide-react

# Copy example code
# Copy frontend_examples/react/App.jsx to frontend/src/App.jsx
# Configure Tailwind (refer to SETUP_GUIDE.md)

# Start the development server.
npm run dev
```

#### Option B: Vue + Vite + Tailwind

```bash
# Create Project
npm create vite@latest frontend -- --template vue
cd frontend

# Install Dependencies
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install lucide-vue-next

# Copy Example Code
# Copy frontend_examples/vue/App.vue to frontend/src/App.vue
# Configure Tailwind (Refer to SETUP_GUIDE.md)

# Start the development server.
npm run dev
```

### 4️⃣ Access App

Frontend Default Address: http://localhost:5173

##  API Interface Documentation

### POST `/api/travel/stream`

An SSE streaming interface that returns the real-time travel planning process.

**Request Body:**
```json
{
  "destination": "Tokyo",
  "travel_dates": "May 15-20, 2026"
}
```

**Event Types:**
- `status` - Status Update
- `tool_call` - AI Tool Call
- `result` - Final Result
- `error` - Error Message
- `done` - Completion Signal

##  Tech Stack

### Backend
- **FastAPI** 
- **LangGraph** 
- **OpenAI GPT-4** 
- **Server-Sent Events (SSE)** 

### Frontend
- **Vite** 
- **React / Vue 3** 
- **Tailwind CSS** 

##  Detailed Documentation

- [API Docs](http://localhost:8000/docs) - FastAPI Automatically Generated API Documentation

##  Features

### Core Functionality
✅ Intelligent Weather Lookup 
✅ AI-Powered Travel Recommendation Generation
✅ Clothing Recommendations Based on Current Weather
✅ Essential Packing Checklist
✅ Weather-Related Activity Suggestions

### Web Interface Features
✅ Real-time Streaming Updates 
✅ Responsive Design 
✅ Elegant Loading Animations
✅ Tool Call Visualization
✅ Error Handling and Notifications

##  TODO

- [ ] Add user input validation
- [ ] Support multi-language responses
- [ ] Cache weather data to reduce API calls
- [ ] Add more dimensions to travel recommendations (dining, accommodation, etc.)
- [ ] Integrate map visualization
- [ ] Support multi-day itinerary planning
- [ ] Add a user feedback mechanism


##  License

MIT License

---
