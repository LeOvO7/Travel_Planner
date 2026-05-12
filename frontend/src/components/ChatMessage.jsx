import { User, Bot, Loader2, CheckCircle, Wrench, AlertCircle } from 'lucide-react';
import { useMemo } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import FlightCard from './FlightCard';
import HotelCard from './HotelCard';
import AttractionCard from './AttractionCard';
import RestaurantCard from './RestaurantCard';
import LocationMap from './LocationMap';

/**
 * ChatMessage Component
 */
export default function ChatMessage({ message, isLatest = false }) {
  const renderMessage = () => {
    switch (message.type) {
      case 'user':
        return <UserMessage message={message} />;
      case 'assistant':
        return <AssistantMessage message={message} />;
      case 'status':
        return <StatusMessage message={message} />;
      case 'tool_call':
        return <ToolCallMessage message={message} />;
      case 'error':
        return <ErrorMessage message={message} />;
      default:
        return null;
    }
  };

  return (
    <div className={isLatest ? 'animate-fadeIn' : ''}>
      {renderMessage()}
    </div>
  );
}

// User message
function UserMessage({ message }) {
  return (
    <div className="flex gap-2 md:gap-4 mb-4 md:mb-6 justify-end">
      <div className="max-w-[95%] md:max-w-[80%] lg:max-w-[70%]">
        <div className="bg-[#6366F1] text-white rounded-2xl rounded-tr-sm px-3 py-2 md:px-4 md:py-3 shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        {message.metadata && (
          <div className="text-xs text-[#64748B] mt-1.5 text-right">
            {message.metadata.destination && `📍 ${message.metadata.destination}`}
            {message.metadata.dates && ` • 📅 ${message.metadata.dates}`}
          </div>
        )}
      </div>
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center shadow-sm">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
}

// AI assistant message
function AssistantMessage({ message }) {
  const structuredData = message.structuredData || [];
  const flights = useMemo(() => structuredData.find(d => d.type === 'flights')?.items || [], [structuredData]);
  const hotels = useMemo(() => structuredData.find(d => d.type === 'hotels')?.items || [], [structuredData]);
  const attractions = useMemo(() => structuredData.find(d => d.type === 'attractions')?.items || [], [structuredData]);
  const restaurants = useMemo(() => structuredData.find(d => d.type === 'restaurants')?.items || [], [structuredData]);
  const weather = useMemo(() => structuredData.find(d => d.type === 'weather')?.items || [], [structuredData]);

  const mapPlaces = useMemo(() => [
    ...hotels.filter(h => h.latitude && h.longitude).map(h => ({
      name: h.name, type: 'hotel', lat: h.latitude, lng: h.longitude,
      info: `${h.reviewScore ? h.reviewScore + '/10' : ''} ${h.reviewScoreWord || ''}`.trim(),
    })),
    ...restaurants.filter(r => r.latitude && r.longitude).map(r => ({
      name: r.name, type: 'restaurant', lat: r.latitude, lng: r.longitude,
      info: `${r.averageRating ? r.averageRating + '/5' : ''} ${r.cuisineTags?.join(', ') || ''}`.trim(),
    })),
    ...attractions.filter(a => a.latitude && a.longitude).map(a => ({
      name: a.name, type: 'attraction', lat: a.latitude, lng: a.longitude,
      info: `${a.rating ? a.rating + '/5' : ''} ${a.shortDescription || ''}`.trim(),
    })),
  ], [hotels, restaurants, attractions]);

  const mapCenter = useMemo(() => {
    if (weather.length > 0 && weather[0].latitude && weather[0].longitude) {
      return [weather[0].latitude, weather[0].longitude];
    }
    if (mapPlaces.length > 0) {
      return [mapPlaces[0].lat, mapPlaces[0].lng];
    }
    return null;
  }, [weather, mapPlaces]);

  const hasCards = flights.length > 0 || hotels.length > 0 || attractions.length > 0 || restaurants.length > 0;

  return (
    <div className="flex gap-2 md:gap-4 mb-4 md:mb-6">
      <div className="flex-shrink-0">
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[#6366F1] flex items-center justify-center shadow-sm">
          <Bot className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
        </div>
      </div>
      <div className="flex-1 max-w-[95%] md:max-w-[85%] lg:max-w-[80%] min-w-0">
        {/* Markdown content */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-sm px-3 py-3 md:px-5 md:py-4 shadow-sm overflow-hidden">
          <MarkdownRenderer content={message.content} />
        </div>

        {/* Structured data cards */}
        {hasCards && (
          <div className="mt-4 space-y-3">
            {flights.length > 0 && <FlightCard flights={flights} />}
            {hotels.length > 0 && <HotelCard hotels={hotels} />}
            {attractions.length > 0 && <AttractionCard attractions={attractions} />}
            {restaurants.length > 0 && <RestaurantCard restaurants={restaurants} />}
            {mapCenter && mapPlaces.length > 0 && (
              <LocationMap places={mapPlaces} center={mapCenter} zoom={12} />
            )}
          </div>
        )}

        {message.isStreaming && (
          <div className="flex items-center gap-2 text-xs text-[#64748B] mt-2">
            <Loader2 className="w-3 h-3 animate-spin text-[#6366F1]" />
            <span>AI is thinking...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Status message
function StatusMessage({ message }) {
  return (
    <div className="flex justify-center mb-4">
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
        message.completed
          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
          : 'bg-indigo-50 border border-indigo-100 text-indigo-700'
      }`}>
        {message.completed
          ? <CheckCircle className="w-4 h-4 text-emerald-500" />
          : <Loader2 className="w-4 h-4 animate-spin" />
        }
        <span>{message.content}</span>
      </div>
    </div>
  );
}

// Tool call message
function ToolCallMessage({ message }) {
  return (
    <div className="flex justify-center mb-4">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-[#E2E8F0] rounded-full text-sm text-[#0F172A]">
        <CheckCircle className="w-4 h-4 text-[#10B981]" />
        <Wrench className="w-3 h-3 text-[#64748B]" />
        <span>
          Called <code className="bg-indigo-50 text-[#6366F1] px-2 py-0.5 rounded text-xs font-medium">{message.tool}</code>
          {message.args?.city && ` for ${message.args.city}`}
        </span>
      </div>
    </div>
  );
}

// Error message
function ErrorMessage({ message }) {
  return (
    <div className="mb-4">
      <div className="bg-red-50 border border-[#EF4444]/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#0F172A] mb-1">Error occurred</p>
            <p className="text-sm text-[#64748B]">{message.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
