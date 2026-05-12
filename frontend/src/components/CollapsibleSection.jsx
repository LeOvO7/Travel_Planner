import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function CollapsibleSection({ icon: Icon, title, count, defaultOpen = true, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 md:gap-2.5 px-3 md:px-4 py-2.5 md:py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        {Icon && <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#6366F1] flex-shrink-0" />}
        <span className="text-sm font-semibold text-[#0F172A] flex-1 truncate">{title}</span>
        {count > 0 && (
          <span className="text-xs px-2 py-0.5 bg-indigo-50 text-[#6366F1] rounded-full font-medium">
            {count}
          </span>
        )}
        {isOpen
          ? <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
          : <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
        }
      </button>
      {isOpen && (
        <div className="px-3 md:px-4 py-2 md:py-3 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}
