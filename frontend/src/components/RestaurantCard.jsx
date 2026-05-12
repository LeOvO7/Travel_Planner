import { Utensils, Star, MapPin } from 'lucide-react';
import CollapsibleSection from './CollapsibleSection';

export default function RestaurantCard({ restaurants }) {
  if (!restaurants || restaurants.length === 0) return null;

  return (
    <CollapsibleSection icon={Utensils} title="Restaurants" count={restaurants.length}>
      <div className="flex flex-col divide-y divide-[#F1F5F9]">
        {restaurants.map((r, i) => (
          <div
            key={i}
            className="flex gap-3 py-3 first:pt-0 last:pb-0 hover:bg-slate-50 -mx-1 px-1 rounded transition-colors"
          >
            {/* Color dot */}
            <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] flex-shrink-0 mt-1.5" />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-[#0F172A] leading-snug line-clamp-1">
                  {r.name}
                </h4>
                {r.priceTag && (
                  <span className="text-xs text-[#64748B] font-medium flex-shrink-0">
                    {r.priceTag}
                  </span>
                )}
              </div>

              {/* Cuisine tags */}
              {r.cuisineTags && r.cuisineTags.length > 0 && (
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {r.cuisineTags.map((tag, j) => (
                    <span
                      key={j}
                      className="text-[10.5px] px-2 py-0.5 bg-indigo-50 text-[#6366F1] rounded-full font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Rating + address */}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {r.averageRating && r.averageRating !== 'N/A' && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                    <span className="text-xs font-semibold text-[#0F172A]">
                      {r.averageRating}/5
                    </span>
                    {r.userReviewCount > 0 && (
                      <span className="text-[11px] text-[#94A3B8]">
                        ({r.userReviewCount.toLocaleString()})
                      </span>
                    )}
                  </div>
                )}
                {r.address && (
                  <div className="flex items-center gap-1 text-[11px] text-[#94A3B8] truncate">
                    <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">{r.address}</span>
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
