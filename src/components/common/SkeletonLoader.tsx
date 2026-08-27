import React from 'react';

interface SkeletonLoaderProps {
  type?: 'card' | 'table' | 'profile' | 'stat' | 'list';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type = 'card', count = 1 }) => {
  const items = Array.from({ length: count });

  if (type === 'stat') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((_, i) => (
          <div key={i} className="bg-[#464858]/60 p-5 rounded-2xl border border-[#A56F63]/20 animate-pulse space-y-3">
            <div className="flex justify-between items-center">
              <div className="w-24 h-4 bg-[#0F3040]/70 rounded"></div>
              <div className="w-8 h-8 bg-[#A56F63]/30 rounded-xl"></div>
            </div>
            <div className="w-20 h-7 bg-[#D99B7F]/40 rounded"></div>
            <div className="w-36 h-3 bg-[#0F3040]/50 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="space-y-3">
        {items.map((_, i) => (
          <div key={i} className="bg-[#464858]/60 p-4 rounded-xl border border-[#A56F63]/20 animate-pulse flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-[#A56F63]/40 rounded"></div>
              <div className="space-y-2">
                <div className="w-48 h-4 bg-[#D99B7F]/30 rounded"></div>
                <div className="w-28 h-3 bg-[#0F3040]/50 rounded"></div>
              </div>
            </div>
            <div className="w-16 h-6 bg-[#0F3040]/60 rounded-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((_, i) => (
        <div key={i} className="bg-[#464858]/70 p-6 rounded-2xl border border-[#A56F63]/20 animate-pulse space-y-4">
          <div className="flex justify-between items-start">
            <div className="w-3/4 h-5 bg-[#D99B7F]/30 rounded"></div>
            <div className="w-10 h-6 bg-[#A56F63]/30 rounded-lg"></div>
          </div>
          <div className="space-y-2">
            <div className="w-1/2 h-4 bg-[#0F3040]/50 rounded"></div>
            <div className="w-2/3 h-4 bg-[#0F3040]/50 rounded"></div>
          </div>
          <div className="pt-4 border-t border-[#A56F63]/20 flex justify-between items-center">
            <div className="w-24 h-4 bg-[#0F3040]/60 rounded"></div>
            <div className="w-20 h-8 bg-[#A56F63]/40 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
