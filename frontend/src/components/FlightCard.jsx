import { Plane, ArrowRight, Clock } from 'lucide-react';
import CollapsibleSection from './CollapsibleSection';

export default function FlightCard({ flights }) {
  if (!flights || flights.length === 0) return null;

  return (
    <CollapsibleSection icon={Plane} title="Flights" count={flights.length}>
      <div className="flex flex-col gap-3">
        {flights.map((fl, i) => (
          <div
            key={i}
            className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Airline + flight number */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Plane className="w-3.5 h-3.5 text-[#6366F1]" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#0F172A]">{fl.airline}</div>
                  {fl.flightNumber && (
                    <div className="text-[11px] text-[#94A3B8] font-mono">{fl.flightNumber}</div>
                  )}
                </div>
              </div>
              {/* Stops badge */}
              {fl.stops === 0 ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                  Direct
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                  {fl.stops} stop{fl.stops > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Route + times */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-center">
                <div className="text-lg font-bold text-[#0F172A]">{fl.departureTime || '--:--'}</div>
                <div className="text-xs text-[#64748B] font-mono">{fl.departureId}</div>
              </div>
              <div className="flex-1 flex flex-col items-center mx-3">
                <div className="flex items-center gap-1 text-[#94A3B8]">
                  <div className="h-px w-8 bg-[#CBD5E1]" />
                  <ArrowRight className="w-3 h-3" />
                </div>
                {fl.duration && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5 text-[#94A3B8]" />
                    <span className="text-[10px] text-[#94A3B8]">{fl.duration}</span>
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[#0F172A]">{fl.arrivalTime || '--:--'}</div>
                <div className="text-xs text-[#64748B] font-mono">{fl.arrivalId}</div>
              </div>
            </div>

            {/* Layovers */}
            {fl.layovers && fl.layovers.length > 0 && (
              <div className="mb-2">
                {fl.layovers.map((lo, j) => (
                  <div key={j} className="text-[11px] text-[#64748B]">
                    via {lo.name} {lo.duration && `(${lo.duration})`}
                  </div>
                ))}
              </div>
            )}

            {/* Price + date */}
            <div className="flex items-end justify-between pt-2 border-t border-dashed border-[#E2E8F0]">
              <div className="text-[11px] text-[#94A3B8]">{fl.date}</div>
              {fl.price != null && (
                <div className="text-lg font-bold text-[#6366F1]">
                  ${typeof fl.price === 'number' ? fl.price.toLocaleString() : fl.price}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}
