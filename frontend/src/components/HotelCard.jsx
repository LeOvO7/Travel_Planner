import { Building2, Star } from 'lucide-react';
import { useState } from 'react';
import CollapsibleSection from './CollapsibleSection';

function HotelPhoto({ url, name }) {
  const [error, setError] = useState(false);

  if (!url || error) {
    return (
      <div
        className="w-full h-[140px] rounded-t-lg"
        style={{
          background: 'linear-gradient(135deg, #312E81 0%, #6366F1 50%, #818CF8 100%)',
        }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <Building2 className="w-8 h-8 text-white/60" />
        </div>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      className="w-full h-[140px] rounded-t-lg object-cover"
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}

function RatingStars({ score10 }) {
  const score5 = (score10 / 10) * 5;
  const full = Math.floor(score5);
  const half = score5 - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className="flex gap-0.5">
      {Array(full).fill(0).map((_, i) => (
        <Star key={`f${i}`} className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
      ))}
      {half && <Star className="w-3 h-3 fill-[#F59E0B]/50 text-[#F59E0B]" />}
      {Array(empty).fill(0).map((_, i) => (
        <Star key={`e${i}`} className="w-3 h-3 text-[#CBD5E1]" />
      ))}
    </div>
  );
}

export default function HotelCard({ hotels }) {
  if (!hotels || hotels.length === 0) return null;

  return (
    <CollapsibleSection icon={Building2} title="Hotels" count={hotels.length}>
      <div className="flex flex-col gap-3">
        {hotels.map((h, i) => (
          <div
            key={i}
            className="bg-white border border-[#E2E8F0] rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            <HotelPhoto url={h.photoUrl} name={h.name} />

            <div className="p-3.5">
              <h4 className="text-sm font-semibold text-[#0F172A] leading-snug line-clamp-2 mb-1.5">
                {h.name}
              </h4>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-2">
                {h.reviewScore && h.reviewScore !== 'N/A' && (
                  <>
                    <span className="text-xs font-bold text-white bg-[#6366F1] px-1.5 py-0.5 rounded">
                      {typeof h.reviewScore === 'number' ? h.reviewScore.toFixed(1) : h.reviewScore}
                    </span>
                    <RatingStars score10={typeof h.reviewScore === 'number' ? h.reviewScore : parseFloat(h.reviewScore) || 0} />
                  </>
                )}
                {h.reviewScoreWord && (
                  <span className="text-xs text-[#64748B]">{h.reviewScoreWord}</span>
                )}
              </div>

              {h.reviewCount > 0 && (
                <div className="text-[11px] text-[#94A3B8] mb-2">
                  {h.reviewCount.toLocaleString()} reviews
                </div>
              )}

              {/* Price */}
              <div className="flex items-end justify-between pt-2 border-t border-dashed border-[#E2E8F0]">
                <div className="text-[11px] text-[#94A3B8]">
                  {h.checkinDate} ~ {h.checkoutDate}
                </div>
                {h.price != null && (
                  <div>
                    <span className="text-lg font-bold text-[#6366F1]">
                      {h.currency || '$'} {typeof h.price === 'number' ? Math.round(h.price).toLocaleString() : h.price}
                    </span>
                    <span className="text-[11px] text-[#94A3B8] ml-0.5">/night</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}
