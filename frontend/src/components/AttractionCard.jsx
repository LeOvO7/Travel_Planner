import { Landmark, Star } from 'lucide-react';
import { useState, memo } from 'react';
import CollapsibleSection from './CollapsibleSection';

// Memoized photo component to prevent unnecessary re-renders
const AttractionPhoto = memo(({ url, name }) => {
  const [imgError, setImgError] = useState(false);

  // Fallback placeholder
  if (!url || imgError) {
    return (
      <div
        className="w-20 h-20 rounded-lg flex-shrink-0 flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #312E81, #6366F1)',
        }}
      >
        <Landmark className="w-6 h-6 text-white/60" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      width={80}
      height={80}
      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
      onError={() => setImgError(true)}
      loading="lazy"
      decoding="async"
    />
  );
});

export default function AttractionCard({ attractions }) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_DISPLAY = 8; // Only show 8 attractions initially

  if (!attractions || attractions.length === 0) return null;

  const displayedAttractions = showAll ? attractions : attractions.slice(0, INITIAL_DISPLAY);
  const hasMore = attractions.length > INITIAL_DISPLAY;

  return (
    <CollapsibleSection icon={Landmark} title="Attractions" count={attractions.length}>
      <div className="flex flex-col gap-3">
        {displayedAttractions.map((a, i) => (
          <div
            key={a.name || i}
            className="flex gap-3.5 bg-white border border-[#E2E8F0] rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <AttractionPhoto url={a.photoUrl} name={a.name} />

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-[#0F172A] leading-snug line-clamp-1 mb-1">
                {a.name}
              </h4>

              {a.shortDescription && (
                <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed mb-2">
                  {a.shortDescription}
                </p>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                {a.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                    <span className="text-xs font-semibold text-[#0F172A]">{a.rating}</span>
                    {a.reviewCount > 0 && (
                      <span className="text-[11px] text-[#94A3B8]">
                        ({a.reviewCount.toLocaleString()})
                      </span>
                    )}
                  </div>
                )}
                {a.price != null && a.price !== '' ? (
                  <span className="text-xs font-medium text-[#6366F1]">
                    From {a.currency || 'USD'} {a.price}
                  </span>
                ) : (
                  a.price === 0 && (
                    <span className="text-xs font-medium text-emerald-600">Free</span>
                  )
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Show more/less button */}
        {hasMore && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full py-2.5 text-sm font-medium text-[#6366F1] bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            Show {attractions.length - INITIAL_DISPLAY} more attractions
          </button>
        )}
        {showAll && hasMore && (
          <button
            onClick={() => setShowAll(false)}
            className="w-full py-2.5 text-sm font-medium text-[#64748B] bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Show less
          </button>
        )}
      </div>
    </CollapsibleSection>
  );
}
