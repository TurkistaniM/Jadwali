import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Sparkles,
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-[#464858]/40 border border-dashed border-[#A56F63]/40 rounded-2xl my-4">
      <div className="w-16 h-16 rounded-2xl bg-[#0F3040] flex items-center justify-center text-[#D99B7F] mb-4 shadow-inner border border-[#A56F63]/30">
        <Icon className="w-8 h-8 opacity-90" />
      </div>
      <h3 className="text-lg font-bold text-[#D99B7F] mb-2">{title}</h3>
      <p className="text-slate-300 text-sm max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#A56F63] hover:bg-[#8E584D] text-white text-sm font-semibold transition-all shadow-md active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-[#D99B7F]" />
          {actionText}
        </button>
      )}
    </div>
  );
};
