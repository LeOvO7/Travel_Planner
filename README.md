# ✈️ Smart Travel Planner

AI-powered travel planning assistant with real-time weather insights, intelligent recommendations, and interactive map visualization.

## 🌟 Features

### Core Capabilities
- 🌤️ **Real-time Weather Forecasting** - Accurate weather data for any destination
- 🤖 **AI-Powered Planning** - Intelligent travel suggestions using GPT-4
- 👕 **Weather-Based Recommendations** - Clothing and packing suggestions
- 🎒 **Smart Packing Lists** - Essential items based on weather conditions
- 🎨 **Activity Recommendations** - Weather-appropriate activities and attractions
- 🗺️ **Interactive Maps** - Google Maps integration with location markers
- ✈️ **Flight Search** - Real-time flight availability and pricing
- 🏨 **Hotel Recommendations** - Accommodation suggestions with ratings
- 🍽️ **Restaurant Finder** - Local dining recommendations

### Technical Features
- ⚡ **Real-time Streaming** - Server-Sent Events (SSE) for live updates
- 💬 **Multi-Session Support** - Manage multiple trip plans simultaneously
- 📱 **Responsive Design** - Mobile-friendly interface
- 🎯 **Mock Data Testing** - Built-in test mode for development
- 🔄 **Auto-reconnection** - Resilient network handling
- 📊 **Structured Data Display** - Rich cards for hotels, restaurants, and attractions

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **LangGraph** - AI Agent orchestration
- **OpenAI GPT-4** - Large language model
- **Server-Sent Events (SSE)** - Real-time streaming
- **Python 3.10+** - Core runtime

### Frontend
- **React 19** - UI framework
- **Vite 8** - Build tool and dev server
- **Tailwind CSS 3** - Utility-first styling
- **Lucide React** - Icon library
- **Google Maps API** - Interactive mapping
- **React Markdown** - Rich text rendering

### APIs & Services
- **OpenWeather API** - Weather data
- **OpenAI API** - AI intelligence
- **RapidAPI** - Travel data (flights, hotels, restaurants)
- **Google Maps JavaScript API** - Map visualization

## 📁 Project Structure

```
Whether/
├── backend/
│   ├── app.py                 # FastAPI server with SSE endpoints
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── ChatInput.jsx
│   │   │   ├── ChatMessage.jsx
│   │   │   ├── MapView.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── ...
│   │   ├── utils/
│   │   │   └── mockTravelData.js  # Mock data for testing
│   │   ├── App.jsx            # Main application component
│   │   └── main.jsx           # Application entry point
│   ├── package.json           # Node dependencies
│   └── ...
├── frontend_examples/         # Example code and templates
│   ├── react/                 # React component examples
│   └── vue/                   # Vue component examples
├── travel_agent.py            # Core AI agent logic (LangGraph)
├── .env                       # API keys (not in git)
├── .env.example               # Environment template
├── start.bat                  # Quick start script (Windows)
├── stop.bat                   # Stop all services (Windows)
└── README.md                  # This file
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **OpenWeather API Key** - [Free tier available](https://openweathermap.org/api)
- **OpenAI API Key** - [Get here](https://platform.openai.com/api-keys)
- **Google Maps API Key** - [Get here](https://developers.google.com/maps/documentation/javascript/get-api-key)
- **RapidAPI Key** (Optional) - [Sign up](https://rapidapi.com/)

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd Whether
```

#### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# OpenWeather API Key
OPENWEATHER_API_KEY=your_openweather_key_here

# OpenAI API Key
OPENAI_API_KEY=your_openai_key_here

# RapidAPI Key (optional - for flights, hotels)
RAPIDAPI_KEY=your_rapidapi_key_here

# Google Maps API Key (for frontend)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

#### 3. Install Backend Dependencies

```bash
pip install -r backend/requirements.txt
```

#### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 🎬 Quick Start

#### Option 1: Using Start Scripts (Windows - Recommended)

Double-click `start.bat` or run:

```bash
start.bat
```

This will automatically:
- ✅ Check environment configuration
- ✅ Start backend server (port 8000)
- ✅ Start frontend dev server (port 5173)
- ✅ Open in separate terminal windows

To stop all services, run:

```bash
stop.bat
```

#### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
uvicorn backend.app:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Main web interface |
| Backend API | http://localhost:8000 | REST API endpoint |
| API Docs | http://localhost:8000/docs | Interactive API documentation |

## 🧪 Testing with Mock Data

Mock data is built-in for testing without consuming API quotas. Perfect for development and demos!

### Trigger Mock Data Mode

To use mock data instead of calling real APIs, enter these values in the planning form:

| Field | Value |
|-------|-------|
| **Departure** | `1` |
| **Destination** | `1` |
| **Travel Dates** | Any date |
| **Message** | `test` |

Click "Plan Trip" and you'll instantly get a complete New York travel plan with:
- ✅ 12 real locations with coordinates
- ✅ 3 hotels with reviews and pricing
- ✅ 4 restaurants with ratings
- ✅ 5 attractions with details
- ✅ Weather data
- ✅ Full map visualization

**No backend required!** Mock data is handled entirely in the frontend.

## 📡 API Documentation

### POST `/api/travel/stream`

Server-Sent Events endpoint for streaming travel plans.

**Request Body:**
```json
{
  "departure": "Los Angeles",
  "destination": "Tokyo",
  "travel_dates": "May 15-20, 2026"
}
```

**Response Events:**

| Event Type | Description | Example |
|------------|-------------|---------|
| `status` | Progress updates | "Searching for flights..." |
| `tool_call` | AI tool invocations | {"tool": "get_weather", "args": {...}} |
| `result` | Final recommendations | Complete travel plan with structured data |
| `error` | Error messages | API errors, timeouts, etc. |
| `done` | Stream completion | End of response signal |

**Structured Data Types:**
- `weather` - Temperature, conditions, humidity, wind
- `flights` - Airlines, times, prices, layovers
- `hotels` - Names, prices, ratings, coordinates
- `restaurants` - Cuisine, ratings, prices, coordinates
- `attractions` - Descriptions, prices, ratings, coordinates

### GET `/`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-12T10:30:00",
  "api_keys_configured": {
    "openweather": true,
    "openai": true,
    "rapidapi": true
  }
}
```

## 🎨 Features Walkthrough

### 1. Multi-Session Management
- Create unlimited trip planning sessions
- Switch between sessions instantly
- Each session maintains complete chat history
- Sessions persist during browser session

### 2. Interactive Chat Interface
- Real-time streaming responses
- Rich markdown formatting
- Code syntax highlighting
- Loading animations and status indicators

### 3. Structured Data Cards
- **Flight Cards** - Airline, times, duration, stops, pricing
- **Hotel Cards** - Photos, ratings, reviews, prices, map links
- **Restaurant Cards** - Cuisine types, ratings, price ranges, addresses
- **Attraction Cards** - Descriptions, photos, pricing, reviews

### 4. Map Visualization
- Interactive Google Maps integration
- Color-coded markers (hotels, restaurants, attractions)
- Click markers for detailed information
- Filter by location type
- Auto-center on selected locations

### 5. Trip Details View
- Comprehensive overview of all recommendations
- Export and share functionality
- Continue planning from detail view

## 🔧 Development

### Project Commands

```bash
# Backend
uvicorn backend.app:app --reload        # Start with hot reload
uvicorn backend.app:app --host 0.0.0.0  # Expose on network

# Frontend
cd frontend
npm run dev         # Development server
npm run build       # Production build
npm run preview     # Preview production build
npm run lint        # Lint code
```

### Development Tips

1. **Backend logs** - View in the terminal running uvicorn
2. **Frontend logs** - Open browser DevTools (F12)
3. **API testing** - Use http://localhost:8000/docs for interactive testing
4. **Hot reload** - Both frontend and backend support automatic reloading
5. **Network issues** - Check CORS settings in `backend/app.py`

### Code Organization

- **Components** - Reusable React components in `frontend/src/components/`
- **Utilities** - Helper functions in `frontend/src/utils/`
- **Styling** - Tailwind classes inline, custom styles in component files
- **State Management** - React hooks (useState, useEffect, useRef)
- **API Layer** - Fetch API with SSE support

## 🔐 Security Best Practices

⚠️ **Important Security Notes:**

1. **Never commit `.env` files** - Keep API keys private
2. **Use environment variables** - No hardcoded secrets
3. **CORS Configuration** - Update for production in `backend/app.py`
4. **API Key Restrictions** - Enable domain restrictions in API consoles
5. **Rate Limiting** - Consider implementing for production
6. **Input Validation** - Sanitize user inputs server-side

### Production Checklist

- [ ] Move `.env` to secure configuration management
- [ ] Update CORS to allow only your domain
- [ ] Enable HTTPS/TLS
- [ ] Set up rate limiting
- [ ] Add authentication if needed
- [ ] Monitor API usage and costs
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Configure CDN for static assets

## 🐛 Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError: No module named 'fastapi'`
```bash
pip install -r backend/requirements.txt
```

**Problem:** `API key not configured`
- Check `.env` file exists in root directory
- Verify API keys are correctly formatted
- Restart the backend server

**Problem:** `Port 8000 already in use`
```bash
# Windows
taskkill /F /IM uvicorn.exe
# Or use a different port
uvicorn backend.app:app --port 8001
```

### Frontend Issues

**Problem:** `Failed to fetch` or CORS errors
- Ensure backend is running on port 8000
- Check `API_URL` in `frontend/src/App.jsx`
- Verify CORS settings in `backend/app.py`

**Problem:** Map not loading
- Verify `VITE_GOOGLE_MAPS_API_KEY` in `.env`
- Check browser console for API errors
- Ensure Maps JavaScript API is enabled in Google Cloud Console

**Problem:** `npm install` fails
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## 📚 Example Frontend Templates

The `frontend_examples/` directory contains reference implementations:

- **React Components** - Complete examples with various features
- **Vue Components** - Vue 3 equivalents
- **HTML Demo** - Standalone HTML file for quick testing
- **Tailwind Config** - Complete Tailwind configuration

These are provided as learning resources and can be used as starting points for customization.

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- [ ] Add user authentication
- [ ] Implement data caching to reduce API calls
- [ ] Support multiple languages (i18n)
- [ ] Add more travel data sources
- [ ] Enhance map features (routes, distance calculations)
- [ ] Mobile app version
- [ ] Trip export (PDF, calendar)
- [ ] User feedback and ratings system
- [ ] Social sharing features
- [ ] Budget tracking and cost optimization

## 📄 License

MIT License 
---

