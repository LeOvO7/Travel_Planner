import { useState, useMemo } from 'react';
import {
  Plane, MapPin, Calendar, CheckCircle, Star,
  Share2, Download, MessageSquare, Building2,
  Utensils, Landmark, ArrowLeft, CloudSun
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import HotelCard from './HotelCard';
import FlightCard from './FlightCard';
import AttractionCard from './AttractionCard';
import RestaurantCard from './RestaurantCard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractStructuredData(session) {
  if (!session?.messages) return [];
  const allData = [];
  for (const msg of session.messages) {
    if (msg.type === 'assistant' && msg.structuredData) {
      allData.push(...msg.structuredData);
    }
  }
  return allData;
}

function getAssistantContent(session) {
  if (!session?.messages) return '';
  const assistantMsg = [...session.messages].reverse().find(m => m.type === 'assistant');
  return assistantMsg?.content || '';
}

const WEATHER_EMOJI = {
  '01d': '☀️', '01n': '🌙',
  '02d': '⛅', '02n': '☁️',
  '03d': '☁️', '03n': '☁️',
  '04d': '☁️', '04n': '☁️',
  '09d': '🌧️', '09n': '🌧️',
  '10d': '🌦️', '10n': '🌧️',
  '11d': '⛈️', '11n': '⛈️',
  '13d': '🌨️', '13n': '🌨️',
  '50d': '🌫️', '50n': '🌫️',
};

function weatherIcon(iconCode) {
  return WEATHER_EMOJI[iconCode] || '🌤️';
}

function formatWeatherDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TripDetail({ session, onBack, onOpenMap, onContinueChat }) {
  const structuredData = useMemo(() => extractStructuredData(session), [session]);
  const assistantContent = useMemo(() => getAssistantContent(session), [session]);

  const weather = structuredData.find(d => d.type === 'weather')?.items?.[0] || null;
  const hotels = structuredData.find(d => d.type === 'hotels')?.items || [];
  const flights = structuredData.find(d => d.type === 'flights')?.items || [];
  const restaurants = structuredData.find(d => d.type === 'restaurants')?.items || [];
  const attractions = structuredData.find(d => d.type === 'attractions')?.items || [];

  const dailyForecast = weather?.daily || [];
  const cityName = weather?.cityName || session?.title?.replace(/^Trip to\s*/i, '') || 'Destination';

  // Build dynamic tabs
  const tabs = useMemo(() => {
    const t = ['Itinerary'];
    if (hotels.length > 0) t.push(`Hotels (${hotels.length})`);
    if (flights.length > 0) t.push(`Flights (${flights.length})`);
    if (restaurants.length > 0) t.push(`Restaurants (${restaurants.length})`);
    if (attractions.length > 0) t.push(`Attractions (${attractions.length})`);
    return t;
  }, [hotels, flights, restaurants, attractions]);

  const [activeTab, setActiveTab] = useState('Itinerary');

  // Snapshot stats from real data
  const stats = useMemo(() => {
    const s = [];
    if (hotels.length > 0) s.push({ label: 'Hotels', value: String(hotels.length) });
    if (flights.length > 0) s.push({ label: 'Flights', value: String(flights.length) });
    if (restaurants.length > 0) s.push({ label: 'Restaurants', value: String(restaurants.length) });
    if (attractions.length > 0) s.push({ label: 'Attractions', value: String(attractions.length) });
    if (dailyForecast.length > 0) s.push({ label: 'Forecast days', value: String(dailyForecast.length) });
    return s;
  }, [hotels, flights, restaurants, attractions, dailyForecast]);

  const tripTitle = session?.title || 'Trip Details';

  // Get user metadata from session
  const userMsg = session?.messages?.find(m => m.type === 'user');
  const destination = userMsg?.metadata?.destination || cityName;
  const dates = userMsg?.metadata?.dates || '';

  // Render tab content
  const renderTabContent = () => {
    if (activeTab === 'Itinerary') {
      return (
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
          <div className="px-[18px] py-3.5 border-b border-[#E2E8F0]">
            <span className="text-[13.5px] font-semibold">Full Travel Guide</span>
          </div>
          <div className="p-[18px]">
            {assistantContent ? (
              <MarkdownRenderer content={assistantContent} />
            ) : (
              <p className="text-sm text-[#64748B]">No itinerary generated yet.</p>
            )}
          </div>
        </div>
      );
    }
    if (activeTab.startsWith('Hotels')) {
      return <HotelCard hotels={hotels} />;
    }
    if (activeTab.startsWith('Flights')) {
      return <FlightCard flights={flights} />;
    }
    if (activeTab.startsWith('Restaurants')) {
      return <RestaurantCard restaurants={restaurants} />;
    }
    if (activeTab.startsWith('Attractions')) {
      return <AttractionCard attractions={attractions} />;
    }
    return null;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="bg-white border-b border-[#E2E8F0] px-7 py-3.5 flex justify-between items-center">
        <div className="flex gap-3.5 items-center">
          <button onClick={onBack} className="p-2 hover:bg-[#F1F5F9] rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 text-[#0F172A]" />
          </button>
          <div className="w-9 h-9 rounded-[10px] bg-[#6366F1] text-white flex items-center justify-center">
            <Plane className="w-[18px] h-[18px]" />
          </div>
          <div>
            <div className="text-sm font-semibold">{tripTitle}</div>
            <div className="text-xs text-[#64748B]">
              {destination}{dates ? ` · ${dates}` : ''}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="text-[12.5px] font-medium px-3.5 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] transition-colors inline-flex gap-1.5 items-center">
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
          <button className="text-[12.5px] font-medium px-3.5 py-2 rounded-lg border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] transition-colors inline-flex gap-1.5 items-center">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={onContinueChat}
            className="text-[12.5px] font-medium px-3.5 py-2 rounded-lg bg-[#6366F1] border border-[#6366F1] text-white hover:bg-indigo-600 transition-colors inline-flex gap-1.5 items-center"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Continue chat
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1080px] mx-auto px-7 py-7">
          {/* Hero */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-xs mb-6">
            <div className="h-[140px] relative overflow-hidden" style={{
              background: 'linear-gradient(135deg, #312E81 0%, #6366F1 50%, #818CF8 100%)'
            }}>
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(circle at 30% 80%, rgba(255,255,255,0.18), transparent 50%), radial-gradient(circle at 80% 10%, rgba(71,191,255,0.25), transparent 45%)'
              }} />
            </div>
            <div className="px-7 py-5 flex justify-between items-start gap-6">
              <div>
                <h1 className="text-[28px] font-bold text-[#0F172A] tracking-[-0.02em]">
                  {cityName}
                  {weather?.current?.description ? ` — ${weather.current.description}` : ''}
                </h1>
                <div className="flex gap-3.5 flex-wrap mt-2 text-[13px] text-[#475569]">
                  <span className="inline-flex gap-1.5 items-center">
                    <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                    {destination}
                  </span>
                  {dates && (
                    <span className="inline-flex gap-1.5 items-center">
                      <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
                      {dates}
                    </span>
                  )}
                  {weather?.current?.temp != null && (
                    <span className="inline-flex gap-1.5 items-center">
                      <CloudSun className="w-3.5 h-3.5 text-[#94A3B8]" />
                      {weather.current.temp}°C now
                    </span>
                  )}
                </div>
              </div>
              <span className="inline-flex gap-1.5 items-center px-3 py-[5px] rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-semibold flex-shrink-0">
                <CheckCircle className="w-[13px] h-[13px]" />
                Plan ready
              </span>
            </div>
            {/* Tabs */}
            <div className="flex gap-1 px-6 border-t border-[#E2E8F0] bg-[#F8FAFC] overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-[11px] text-[13px] font-medium border-b-2 -mt-px transition-colors whitespace-nowrap ${
                    activeTab === tab
                      ? 'text-[#4338CA] border-[#6366F1]'
                      : 'text-[#64748B] border-transparent hover:text-[#0F172A]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Grid: main + aside */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* Main column */}
            <div className="flex flex-col gap-[18px]">
              {/* Weather card */}
              {dailyForecast.length > 0 && (
                <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
                  <div className="px-[18px] py-3.5 border-b border-[#E2E8F0] flex justify-between items-center">
                    <span className="text-[13.5px] font-semibold">
                      {dailyForecast.length}-day forecast
                    </span>
                    <span className="font-mono text-[10.5px] px-2 py-0.5 rounded-full bg-[#EEF2FF] text-[#4338CA] font-semibold tracking-wide">
                      get_weather
                    </span>
                  </div>
                  <div className="p-[18px]">
                    <div className={`grid gap-2`} style={{
                      gridTemplateColumns: `repeat(${Math.min(dailyForecast.length, 7)}, minmax(0, 1fr))`
                    }}>
                      {dailyForecast.slice(0, 7).map(w => (
                        <div key={w.date} className="border border-[#E2E8F0] rounded-[10px] p-3 text-center bg-white">
                          <div className="font-mono text-[10.5px] text-[#94A3B8] tracking-wider uppercase">
                            {formatWeatherDate(w.date)}
                          </div>
                          <div className="text-2xl leading-none my-1.5">{weatherIcon(w.icon)}</div>
                          <div className="text-[15px] font-semibold">
                            {Math.round(w.maxTemp)}°/{Math.round(w.minTemp)}°
                          </div>
                          <div className="text-[11px] text-[#64748B] mt-0.5 line-clamp-1">{w.summary}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab content */}
              {renderTabContent()}
            </div>

            {/* Aside column */}
            <div className="flex flex-col gap-[18px]">
              {/* Map preview card */}
              <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
                <div className="px-[18px] py-3.5 border-b border-[#E2E8F0]">
                  <span className="text-[13.5px] font-semibold">Map preview</span>
                </div>
                <div className="p-[18px]">
                  <button
                    onClick={() => onOpenMap?.({ session })}
                    className="w-full h-[170px] rounded-xl relative overflow-hidden border border-[#E2E8F0] cursor-pointer hover:shadow-md transition-shadow"
                    style={{
                      background: 'linear-gradient(135deg, #E0E7FF 0%, #F1F5F9 100%)',
                    }}
                  >
                    <div className="absolute inset-0" style={{
                      backgroundImage: 'linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                      mixBlendMode: 'multiply',
                    }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="w-8 h-8 text-[#6366F1] mx-auto mb-1" />
                        <span className="text-xs font-medium text-[#6366F1]">
                          View full map
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Snapshot card */}
              {stats.length > 0 && (
                <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
                  <div className="px-[18px] py-3.5 border-b border-[#E2E8F0]">
                    <span className="text-[13.5px] font-semibold">Snapshot</span>
                  </div>
                  <div className="px-[18px] py-3.5">
                    {stats.map((stat, i) => (
                      <div
                        key={stat.label}
                        className={`flex justify-between text-[13px] py-2 ${
                          i < stats.length - 1 ? 'border-b border-dashed border-[#E2E8F0]' : ''
                        }`}
                      >
                        <span>{stat.label}</span>
                        <span className="font-semibold">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
